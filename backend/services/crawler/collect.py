"""収集元プレイヤー1人分の試合の収集。

ソロランク（queue=420）の直近の試合のうち、未保存で取得不能でないものを
詳細 + タイムラインで取得し、収集元のランク帯を付けて保存する。
失敗の記録は Backfill と同じ（failed_matches。3回で取得不能）。
収集日時は、失敗なく最後まで処理できたときだけ更新する
（失敗した試合は、次回も同じ収集元から取り直すため）。
"""

import logging
from datetime import datetime, timedelta, timezone

from adapters import crawler_seed_store, failed_match_store, summoner_store
from adapters.raw_store import RawArchive
from schemas.crawler import CollectResult, CrawlerSeed
from schemas.riot_fetch import FailedFetch, FetchedMatch
from services.summoner import riot_fetch
from services.summoner.backfill_page import store_result
from services.summoner.riot_errors import RiotRateLimitError, describe_fetch_error

logger = logging.getLogger(__name__)

# 対象はソロ/デュオ。1回に取得する試合IDの件数と、初回の遡る期間
SOLO_QUEUE_ID = 420
MATCH_COUNT = 20
INITIAL_LOOKBACK = timedelta(days=3)


def _with_tier(
    fetched: FetchedMatch, tier: str, bundle_key: str | None
) -> FetchedMatch:
    """試合と参加者にランク帯を付け、試合に生データのまとめファイルのキーを付ける。"""
    return fetched.model_copy(
        update={
            "match": fetched.match.model_copy(
                update={"rank_tier": tier, "raw_bundle_key": bundle_key}
            ),
            "participants": [
                p.model_copy(update={"rank_tier": tier}) for p in fetched.participants
            ],
        }
    )


async def _store(
    fetched: list[FetchedMatch],
    failures: list[FailedFetch],
    tier: str,
    bundle_key: str | None,
    result: CollectResult,
) -> None:
    """取得できた試合を保存し、失敗を記録して、件数を result に足す。"""
    await store_result([_with_tier(f, tier, bundle_key) for f in fetched], failures)
    result.matches_saved += len(fetched)
    result.matches_failed += len(failures)


async def _fetch_ids(
    region: str, seed: CrawlerSeed, since: datetime
) -> list[str] | None:
    """収集元の直近のソロランクの試合IDを返す。429 以外の失敗は None。"""
    try:
        return await riot_fetch.fetch_ranked_match_ids(
            region,
            seed.puuid,
            start=0,
            count=MATCH_COUNT,
            start_time=since,
            priority="backfill",
            queue=SOLO_QUEUE_ID,
        )
    except RiotRateLimitError:
        raise
    except Exception as e:
        # PUUID は出さない
        logger.warning(
            "試合ID一覧の取得に失敗しました: %s %s",
            seed.tier,
            describe_fetch_error(e),
        )
        return None


async def collect_seed(
    region: str,
    seed: CrawlerSeed,
    archive: RawArchive,
    result: CollectResult | None = None,
    bundle_key: str | None = None,
) -> CollectResult:
    """収集元1人分の試合を集めて保存する。

    Args:
        archive: 生データの保管先（クローラーはバンドル）
        result: 件数を足していく結果。渡すと、429 で中断してもそれまでの件数が残る
        bundle_key: 保存する試合の raw_bundle_key に書く、まとめファイルのキー
            （None なら書き込まない）

    Returns:
        収集結果（result を渡した場合は同じオブジェクト）

    Raises:
        RiotRateLimitError: 429 または送信前のレート制限。取得済みの試合の保存と
            失敗の記録を済ませてから送出する。収集日時は更新しない。
    """
    result = result if result is not None else CollectResult()
    started = datetime.now(timezone.utc)
    ids = await _fetch_ids(
        region, seed, seed.last_crawled_at or started - INITIAL_LOOKBACK
    )
    if ids is None:
        result.seed_failed = True
        return result

    unsaved = await summoner_store.filter_unsaved_match_ids(ids)
    gave_up = await failed_match_store.get_gave_up_match_ids(unsaved)
    to_fetch = [m for m in unsaved if m not in gave_up]
    failed = False
    if to_fetch:
        try:
            details = await riot_fetch.fetch_match_details(
                region, to_fetch, priority="backfill", archive=archive
            )
        except RiotRateLimitError as e:
            await _store(e.fetched, e.failures, seed.tier, bundle_key, result)
            raise
        await _store(details.fetched, details.failures, seed.tier, bundle_key, result)
        failed = bool(details.failures)

    if not failed:
        # 処理中に終わった試合を次回に取りこぼさないよう、開始時刻を記録する
        await crawler_seed_store.mark_crawled(seed.puuid, started)
        result.completed = True
    return result
