"""Backfill の1ページ分の取得: 未保存の試合を取得して保存し、失敗を記録する。

「通過済み」の試合 = match_participants に保存済み、または failed_matches で
gave_up = true の試合。カーソルは通過済みの範囲までしか進めない。
"""

from adapters import failed_match_store, summoner_store
from schemas.riot_fetch import FailedFetch, FetchedMatch
from services.summoner import riot_fetch
from services.summoner.sync import save_fetched

# 同じ試合の取得に失敗できる回数。到達したら取得不能（gave_up）にする
MAX_ATTEMPTS = 3


async def process_page(region: str, match_ids: list[str]) -> list[str]:
    """ページの試合のうち未保存分を取得して保存し、通過済みでない試合IDを返す。

    取得不能と判定済みの試合は取得しない。今回の取得で3回目の失敗になった試合は、
    取得不能として通過済みに数える。

    Returns:
        通過済みでない試合ID（match_ids の順）。空ならページ全体が通過済み。

    Raises:
        RiotRateLimitError: 429 または送信前のレート制限。取得済みの試合の保存と
            失敗の記録を済ませてから送出する。
    """
    unsaved = await summoner_store.filter_unsaved_match_ids(match_ids)
    if not unsaved:
        return []
    gave_up = await failed_match_store.get_gave_up_match_ids(unsaved)
    to_fetch = [m for m in unsaved if m not in gave_up]
    if not to_fetch:
        return []

    try:
        result = await riot_fetch.fetch_match_details(
            region, to_fetch, priority="backfill"
        )
    except riot_fetch.RiotRateLimitError as e:
        await _store_result(e.fetched, e.failures)
        raise
    newly_gave_up = await _store_result(result.fetched, result.failures)

    fetched_ids = {f.match.match_id for f in result.fetched}
    return [m for m in to_fetch if m not in fetched_ids and m not in newly_gave_up]


async def _store_result(
    fetched: list[FetchedMatch], failures: list[FailedFetch]
) -> set[str]:
    """取得できた試合を保存して失敗記録を消し、失敗を記録する。

    Returns:
        今回の記録で取得不能（gave_up）になっている試合ID
    """
    await save_fetched(fetched)
    await failed_match_store.delete_failed_matches([f.match.match_id for f in fetched])
    return await failed_match_store.record_failed_matches(failures, MAX_ATTEMPTS)
