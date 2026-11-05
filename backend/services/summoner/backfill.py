"""Backfill サービス: 過去の対象試合をバックグラウンドで取得して保存する。

summoners の2つのカーソルで取得済み範囲を管理し、再取得を防ぐ。
カーソルは必ず「そのページの試合がすべて通過済みになった後」に更新する
（通過済み = 保存済み、または取得不能と判定済み。backfill_page.py を参照）。
"""

import logging
from datetime import datetime

from adapters import summoner_store
from schemas.summoner_store import BackfillState
from services.summoner import riot_fetch
from services.summoner.backfill_page import process_page

logger = logging.getLogger(__name__)

# 1回の試合ID一覧取得の件数（Riot API の上限）
_PAGE_SIZE = 100


async def run_backfill(region: str, puuid: str) -> None:
    """未保存の対象試合を新しい側・古い側の順に取得する。

    例外は外に出さず、ログに記録して終了する。429 を受けたら、
    取得できた試合を保存し、カーソルを進めずに終了する（次回は続きから取得する）。
    """
    try:
        await _run(region, puuid)
    except riot_fetch.RiotRateLimitError:
        logger.warning("Backfill をレート制限により中断しました: puuid=%s", puuid)
    except Exception:
        logger.error("Backfill に失敗しました: puuid=%s", puuid, exc_info=True)


async def _run(region: str, puuid: str) -> None:
    if not await summoner_store.try_start_backfill(puuid, region):
        logger.info("Backfill は実行中または直近に開始済みです: puuid=%s", puuid)
        return
    record = await summoner_store.find_summoner_by_puuid(puuid, region)
    if record is None:
        logger.warning("Backfill 対象のサモナーが未登録です: puuid=%s", puuid)
        return

    state = BackfillState(
        synced_until=record.synced_until,
        backfill_cursor=record.backfill_cursor,
        backfill_completed=record.backfill_completed,
    )
    if state.synced_until is not None:
        state, all_passed = await _fill_newer(region, puuid, state)
        if not all_passed:
            return
    if not state.backfill_completed:
        await _fill_older(region, puuid, state)


async def _page_end_times(ids: list[str]) -> list[datetime]:
    """ids のうち保存済みの試合の終了日時を返す（取得不能の試合は含まれない）。"""
    return list((await summoner_store.get_match_end_times(ids)).values())


async def _fill_newer(
    region: str, puuid: str, state: BackfillState
) -> tuple[BackfillState, bool]:
    """フェーズA: synced_until 以降の隙間を埋め、synced_until を最新に更新する。

    通過済みでない試合が残ったページがあれば、synced_until を進めずに止める
    （次回、同じ範囲を取り直す。保存済みは除外されるため、再取得は失敗分だけ）。

    Returns:
        (更新後の状態, 全ページが通過済みか)。False なら Backfill を終了する。
    """
    newest: datetime | None = None
    offset = 0
    while True:
        ids = await riot_fetch.fetch_ranked_match_ids(
            region,
            puuid,
            start=offset,
            count=_PAGE_SIZE,
            start_time=state.synced_until,
            priority="backfill",
        )
        if await process_page(region, ids):
            logger.info("Backfill: 取得に失敗した試合が残っています: puuid=%s", puuid)
            return state, False
        end_times = await _page_end_times(ids)
        newest = max([t for t in [newest, *end_times] if t is not None], default=None)
        if len(ids) < _PAGE_SIZE:
            break
        offset += _PAGE_SIZE

    if newest is None or (state.synced_until and newest <= state.synced_until):
        return state, True
    updated = state.model_copy(update={"synced_until": newest})
    await summoner_store.update_backfill_state(puuid, region, updated)
    return updated, True


async def _fill_older(region: str, puuid: str, state: BackfillState) -> None:
    """フェーズB: backfill_cursor から過去へさかのぼり、1ページごとにカーソルを進める。

    カーソルは、ページの先頭から「最初の通過済みでない試合」の直前までの
    最古の時刻に進める。通過済みでない試合が残ったページでは、
    backfill_completed を true にせず Backfill を終了する。
    """
    cursor = state.backfill_cursor
    while True:
        ids = await riot_fetch.fetch_ranked_match_ids(
            region,
            puuid,
            start=0,
            count=_PAGE_SIZE,
            end_time=cursor,
            priority="backfill",
        )
        unresolved = await process_page(region, ids)
        passed_ids = ids[: ids.index(unresolved[0])] if unresolved else ids
        oldest = min(await _page_end_times(passed_ids), default=None)
        completed = len(ids) < _PAGE_SIZE and not unresolved

        # カーソルは古い方向にしか動かさない
        new_cursor = min([t for t in (oldest, cursor) if t is not None], default=None)
        if unresolved:
            logger.info("Backfill: 取得に失敗した試合が残っています: puuid=%s", puuid)
            if new_cursor != cursor:
                await _save_cursor(puuid, region, state, new_cursor, False)
            return
        if not completed and (oldest is None or (cursor and oldest >= cursor)):
            # 次のページが同じ範囲になり、無限ループになるため終了する
            logger.warning("Backfill のカーソルが進まないため終了: puuid=%s", puuid)
            return

        await _save_cursor(puuid, region, state, new_cursor, completed)
        if completed:
            return
        cursor = new_cursor


async def _save_cursor(
    puuid: str,
    region: str,
    state: BackfillState,
    cursor: datetime | None,
    completed: bool,
) -> None:
    """古い側のカーソルと完了フラグを保存する（synced_until は state のまま）。"""
    await summoner_store.update_backfill_state(
        puuid,
        region,
        BackfillState(
            synced_until=state.synced_until,
            backfill_cursor=cursor,
            backfill_completed=completed,
        ),
    )
