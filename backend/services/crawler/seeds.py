"""収集元プレイヤーの更新と選択。

- 更新: league-v4 のランク一覧（マスター以上 3回 + ダイヤモンド・エメラルド 8回）を
  1日1回取り直して crawler_seeds に upsert し、7日以上更新されていない行を削除する
- 選択: エメラルド / ダイヤモンド / マスター以上の3つの帯から交互に1人ずつ、
  last_crawled_at が古い順（NULL が先）に選ぶ
"""

import logging
from datetime import datetime, timedelta, timezone
from itertools import zip_longest
from typing import Any

from adapters import crawler_seed_store
from schemas.crawler import CrawlerSeed, RankTier
from services.summoner.region import get_platform
from services.summoner.riot_request import get_riot

logger = logging.getLogger(__name__)

# 収集元を更新する間隔と、更新されなくなった行を削除するまでの期間
REFRESH_INTERVAL = timedelta(hours=24)
STALE_AFTER = timedelta(days=7)

_QUEUE = "RANKED_SOLO_5x5"
_DIVISIONS = ("I", "II", "III", "IV")

# マスター以上: (tier, league-v4 のパス)。重複時に高いランクを残すため上から順に取得する
_TOP_LEAGUES: tuple[tuple[RankTier, str], ...] = (
    ("CHALLENGER", "challengerleagues"),
    ("GRANDMASTER", "grandmasterleagues"),
    ("MASTER", "masterleagues"),
)
_LOWER_TIERS: tuple[RankTier, ...] = ("DIAMOND", "EMERALD")

# 選択の3つの帯（この順に交互に選ぶ）
_BANDS: tuple[list[RankTier], ...] = (
    ["EMERALD"],
    ["DIAMOND"],
    ["MASTER", "GRANDMASTER", "CHALLENGER"],
)


def _to_seed(
    entry: dict[str, Any], tier: RankTier, division: str | None, now: datetime
) -> CrawlerSeed | None:
    """リーグのエントリーを収集元にする。puuid がなければ None。"""
    puuid = entry.get("puuid")
    if not isinstance(puuid, str) or not puuid:
        return None
    return CrawlerSeed(
        puuid=puuid,
        tier=tier,
        division=division,
        league_points=int(entry.get("leaguePoints", 0)),
        refreshed_at=now,
    )


def _collect(
    entries: list[dict[str, Any]],
    tier: RankTier,
    division: str | None,
    now: datetime,
    found: dict[str, CrawlerSeed],
) -> None:
    """entries を found に足す。puuid のないエントリーは飛ばし、重複は先のものを残す。"""
    skipped = 0
    for entry in entries:
        seed = _to_seed(entry, tier, division, now)
        if seed is None:
            skipped += 1
        else:
            found.setdefault(seed.puuid, seed)
    if skipped:
        logger.warning("puuid のないエントリーを飛ばしました: %s %d件", tier, skipped)


async def _fetch_seeds(region: str, now: datetime) -> list[CrawlerSeed]:
    """league-v4 のランク一覧から収集元を取得する（Riot API を 11回呼ぶ）。

    Raises:
        Exception: いずれかの取得に失敗した（一部だけ更新しないよう、全体を失敗にする）
    """
    host = get_platform(region)
    found: dict[str, CrawlerSeed] = {}
    for tier, path in _TOP_LEAGUES:
        league = await get_riot(
            host, f"/lol/league/v4/{path}/by-queue/{_QUEUE}", priority="backfill"
        )
        _collect(league["entries"], tier, None, now, found)
    for tier in _LOWER_TIERS:
        for division in _DIVISIONS:
            entries = await get_riot(
                host,
                f"/lol/league/v4/entries/{_QUEUE}/{tier}/{division}",
                {"page": 1},
                "backfill",
            )
            _collect(entries, tier, division, now, found)
    return list(found.values())


async def refresh_seeds_if_stale(region: str) -> None:
    """最後の更新から24時間以上たっていれば、収集元を更新する。

    失敗しても例外にしない。ログに残し、既存の収集元で続ける
    （一部だけ取得できた場合も書き込まない）。
    """
    try:
        now = datetime.now(timezone.utc)
        last = await crawler_seed_store.get_last_refreshed_at()
        if last is not None and now - last < REFRESH_INTERVAL:
            return
        seeds = await _fetch_seeds(region, now)
        if not seeds:
            logger.warning("収集元が0人だったため更新しませんでした")
            return
        await crawler_seed_store.upsert_seeds(seeds, region)
        deleted = await crawler_seed_store.delete_stale_seeds(now - STALE_AFTER)
        logger.info("収集元を更新しました: %d人（削除 %d人）", len(seeds), deleted)
    except Exception:
        logger.warning(
            "収集元の更新に失敗しました。既存の収集元で続けます", exc_info=True
        )


async def pick_seeds(limit: int) -> list[CrawlerSeed]:
    """3つの帯から交互に、古い順で最大 limit 人の収集元を選ぶ。"""
    per_band = [
        await crawler_seed_store.get_seeds_by_band(band, limit) for band in _BANDS
    ]
    picked: list[CrawlerSeed] = []
    for round_seeds in zip_longest(*per_band):
        picked.extend(seed for seed in round_seeds if seed is not None)
    return picked[:limit]
