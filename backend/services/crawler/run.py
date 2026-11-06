"""クローラー1回の起動の流れ（リースの取得・返却は lambda_handlers/crawler.py）。

収集元の更新 → 選択 → 1人ずつ収集 → バンドルの書き込み → 上限を超えた試合の削除
→ 結果のログ。締め切り・429・失敗の多さで、収集を途中で終える。
"""

import logging

from adapters.raw_bundle_store import BundleArchive, crawler_bundle_key
from adapters.riot_rate_limiter import get_limiter
from schemas.crawler import CollectResult, CrawlResult, StopReason
from services.crawler import prune, seeds
from services.crawler.collect import collect_seed
from services.summoner import deadline as deadline_check
from services.summoner.riot_errors import RiotRateLimitError

logger = logging.getLogger(__name__)

# 1回の起動で選ぶ収集元の最大数（実際に処理できる人数より多めにしておく）
SEED_BATCH = 30
# 残り時間がこの秒数を切ったら、次の収集元に進まない
# （2分の窓の待ち（最大120秒）と、保存・バンドルの書き込みの余裕）
DEADLINE_MARGIN_SECONDS = 150.0
# 1回の起動で許容する失敗の数（試合の取得失敗 + 試合ID一覧の取得失敗）
MAX_FAILURES = 10


async def _crawl_seeds(
    region: str, deadline: float | None, archive: BundleArchive, totals: CrawlResult
) -> StopReason:
    """収集元を順に収集し、totals に件数を足す。終了理由を返す。"""
    picked = await seeds.pick_seeds(SEED_BATCH)
    if not picked:
        return "no_seeds"
    failures = 0
    for seed in picked:
        if deadline_check.is_near(deadline, DEADLINE_MARGIN_SECONDS):
            return "deadline"
        partial = CollectResult()
        try:
            await collect_seed(region, seed, archive, partial)
        except RiotRateLimitError:
            _add(totals, partial)
            return "rate_limited"
        _add(totals, partial)
        failures += partial.matches_failed + int(partial.seed_failed)
        if failures >= MAX_FAILURES:
            return "too_many_failures"
    return "completed"


def _add(totals: CrawlResult, partial: CollectResult) -> None:
    totals.seeds_crawled += int(partial.completed)
    totals.matches_saved += partial.matches_saved
    totals.matches_failed += partial.matches_failed


async def _flush(archive: BundleArchive) -> None:
    """バンドルを書き込む。失敗はログに残すだけ（DB は保存済み）。"""
    try:
        count = await archive.flush()
        logger.info("生データのバンドルを書き込みました: %d試合", count)
    except Exception:
        logger.error("生データのバンドルの書き込みに失敗しました", exc_info=True)


async def _prune() -> int:
    """上限を超えた試合を削除する。失敗はログに残すだけ（次の起動で再実行）。"""
    try:
        return await prune.prune()
    except Exception:
        logger.error("クローラーの試合の削除に失敗しました", exc_info=True)
        return 0


async def run_crawl(region: str, deadline: float | None, run_id: str) -> CrawlResult:
    """クローラーを1回動かし、結果をログに1行（JSON）で出す。

    Args:
        region: リージョン文字列（例: "JP"）
        deadline: 締め切り（time.monotonic() の値。None は締め切りなし）
        run_id: 起動の ID（バンドルのファイル名に使う）
    """
    limiter = get_limiter()
    sent_before = limiter.total_sent
    totals = CrawlResult(stop_reason="completed")
    archive = BundleArchive(crawler_bundle_key(run_id))
    try:
        await seeds.refresh_seeds_if_stale(region)
        totals.stop_reason = await _crawl_seeds(region, deadline, archive, totals)
    finally:
        # 予期しない例外でも、保存済みの試合の生データは書き込む
        await _flush(archive)
    totals.matches_pruned = await _prune()
    totals.riot_requests = limiter.total_sent - sent_before
    logger.info(totals.model_dump_json())
    return totals
