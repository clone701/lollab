"""既存試合の補完フェーズ: ビルド・試合詳細用の項目が欠けた試合を取得し直す。

Backfill のフェーズ2の後に呼ぶ。対象は全サモナー共通の試合で、サモナー単位ではない。

- detail_version < 2 の試合: 試合詳細を取り直し、ルーン・シャード・BAN・生データを保存する
- timeline_fetched_at IS NULL の試合: タイムラインを取得して保存する
  （試合詳細は保管済みの生データから読み、なければ Riot API から取得する）

古い試合から順に処理し、Backfill の予約枠に達したら（RiotRateLimitError）終了する。
取得に失敗した試合（429 以外）は failed_matches で回数を数え、取得不能（gave_up）に
なった試合は対象から外す（無限に再試行しない）。
"""

import logging
from collections.abc import AsyncGenerator
from datetime import datetime

from adapters import enrich_store, failed_match_store
from schemas.riot_fetch import FailedFetch
from schemas.summoner_store import EnrichTarget
from services.summoner import deadline as deadline_check
from services.summoner import riot_fetch
from services.summoner.backfill_page import store_result
from services.summoner.region import region_of_match_id

logger = logging.getLogger(__name__)

# 1回に取得する補完対象の件数
_PAGE_SIZE = 50


async def _pending_pages() -> AsyncGenerator[list[EnrichTarget], None]:
    """補完が必要で、取得不能と判定されていない試合を、古い順にページ単位で返す。

    次のページの取得時には、処理済みの試合は対象から外れている。失敗した試合は
    対象に残るが、既に返した試合は除くため、同じ試合を繰り返し返さない。
    """
    seen: set[str] = set()
    after: datetime | None = None
    while True:
        candidates = await enrich_store.get_enrichment_targets(after, _PAGE_SIZE)
        fresh = [c for c in candidates if c.match_id not in seen]
        if not fresh:
            return
        seen.update(c.match_id for c in fresh)
        gave_up = await failed_match_store.get_gave_up_match_ids(
            [c.match_id for c in fresh]
        )
        pending = [c for c in fresh if c.match_id not in gave_up]
        if pending:
            yield pending
        if len(candidates) < _PAGE_SIZE:
            return
        after = candidates[-1].game_end_at


async def has_pending_targets() -> bool:
    """補完の対象になる試合が1件以上あるか（取得不能と判定済みの試合は除く）。"""
    pages = _pending_pages()
    try:
        return await anext(pages, None) is not None
    finally:
        await pages.aclose()


async def run_enrichment(deadline: float | None = None) -> None:
    """補完対象の試合を古い順に取得して保存する。

    deadline（time.monotonic() の値）の残りが30秒を切ったら、ページの区切りで終了する。

    Raises:
        RiotRateLimitError: 429 または Backfill の予約枠に達した。取得済みの試合の
            保存と失敗の記録を済ませてから送出する。
    """
    async for page in _pending_pages():
        if deadline_check.is_near(deadline):
            logger.info("補完: 残り時間が少ないため終了します")
            return
        await _enrich_page(page)


async def _enrich_page(targets: list[EnrichTarget]) -> None:
    """1ページ分を、リージョンごとに取得して保存する。"""
    by_region: dict[str, list[EnrichTarget]] = {}
    unknown: list[FailedFetch] = []
    for target in targets:
        region = region_of_match_id(target.match_id)
        if region is None:
            unknown.append(FailedFetch(match_id=target.match_id, error="UnknownRegion"))
        else:
            by_region.setdefault(region, []).append(target)
    if unknown:
        logger.warning("リージョンが不明な試合を補完できません: %d件", len(unknown))
        await store_result([], unknown)

    for region, group in by_region.items():
        try:
            result = await riot_fetch.fetch_match_details(
                region,
                [t.match_id for t in group],
                priority="backfill",
                timeline_only_ids=frozenset(
                    t.match_id for t in group if not t.needs_detail
                ),
            )
        except riot_fetch.RiotRateLimitError as e:
            await store_result(e.fetched, e.failures)
            raise
        await store_result(result.fetched, result.failures)
    logger.info("補完: %d件を処理しました", len(targets))
