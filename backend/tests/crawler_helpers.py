"""クローラー（collect / run / seeds / ハンドラー）のテスト用ヘルパー。

本物のストアは import 時に Supabase クライアントを作るため、代役のモジュールを登録する。
試合の保存・取得は sync_helpers の FakeStore / FakeRiot を使う。
"""

import sys
from datetime import datetime, timezone
from types import ModuleType
from typing import Any
from unittest.mock import AsyncMock

import pytest

from schemas.crawler import CrawlerSeed, RankTier
from schemas.summoner_store import BanRecord, MatchRecord, ParticipantRecord
from tests.sync_helpers import FakeStore, install_store_stub

NOW = datetime(2026, 11, 6, 12, 0, tzinfo=timezone.utc)

_STUBS: dict[str, tuple[str, ...]] = {
    "adapters.crawler_seed_store": (
        "get_last_refreshed_at",
        "upsert_seeds",
        "delete_stale_seeds",
        "get_seeds_by_band",
        "mark_crawled",
    ),
    "adapters.crawler_match_store": ("prune_crawler_matches",),
    "adapters.worker_lease_store": ("try_acquire", "release"),
}


def install_crawler_stubs() -> None:
    """crawler 関連のストアを（未登録なら）スタブとして登録する。"""
    install_store_stub()
    for module_name, functions in _STUBS.items():
        module = sys.modules.get(module_name)
        if module is None:
            module = ModuleType(module_name)
            sys.modules[module_name] = module
        for name in functions:
            if not hasattr(module, name):
                setattr(module, name, AsyncMock())


def make_seed(
    puuid: str = "seed-0",
    tier: RankTier = "EMERALD",
    last_crawled_at: datetime | None = None,
) -> CrawlerSeed:
    return CrawlerSeed(
        puuid=puuid,
        tier=tier,
        division=None if tier in ("MASTER", "GRANDMASTER", "CHALLENGER") else "I",
        league_points=50,
        refreshed_at=NOW,
        last_crawled_at=last_crawled_at,
    )


class CrawlerFakeStore(FakeStore):
    """FakeStore に、保存した参加者の記録を足したもの。"""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.saved_participants: list[ParticipantRecord] = []

    async def save_matches(
        self,
        matches: list[MatchRecord],
        participants: list[ParticipantRecord],
        bans: list[BanRecord] | None = None,
    ) -> None:
        self.saved_participants.extend(participants)
        await super().save_matches(matches, participants, bans)


class FakeSeedStore:
    """crawler_seed_store の代役。収集元をメモリに持つ。"""

    def __init__(
        self,
        seeds: list[CrawlerSeed] | None = None,
        last_refreshed_at: datetime | None = None,
    ) -> None:
        self.seeds = {s.puuid: s for s in seeds or []}
        self.last_refreshed_at = last_refreshed_at
        self.upserted: list[CrawlerSeed] = []
        self.upsert_region: str | None = None
        self.deleted_older_than: datetime | None = None
        self.crawled: list[tuple[str, datetime]] = []
        self.band_calls: list[tuple[list[str], int]] = []

    async def get_last_refreshed_at(self) -> datetime | None:
        return self.last_refreshed_at

    async def upsert_seeds(self, seeds: list[CrawlerSeed], region: str) -> None:
        self.upserted = list(seeds)
        self.upsert_region = region
        for seed in seeds:
            self.seeds[seed.puuid] = seed

    async def delete_stale_seeds(self, older_than: datetime) -> int:
        self.deleted_older_than = older_than
        return 0

    async def get_seeds_by_band(
        self, band: list[RankTier], limit: int
    ) -> list[CrawlerSeed]:
        self.band_calls.append((list(band), limit))
        matched = [s for s in self.seeds.values() if s.tier in band]
        matched.sort(key=lambda s: (s.last_crawled_at is not None, s.last_crawled_at))
        return matched[:limit]

    async def mark_crawled(self, puuid: str, at: datetime) -> None:
        self.crawled.append((puuid, at))


def install_seed_store(
    monkeypatch: pytest.MonkeyPatch, seed_store: FakeSeedStore
) -> None:
    """services が使う crawler_seed_store の関数を代役に差し替える。"""
    from services.crawler import seeds

    for name in (
        "get_last_refreshed_at",
        "upsert_seeds",
        "delete_stale_seeds",
        "get_seeds_by_band",
        "mark_crawled",
    ):
        monkeypatch.setattr(
            seeds.crawler_seed_store, name, getattr(seed_store, name), raising=False
        )
