"""search / update / backfill のテスト用ヘルパー。

Summoner_Store をメモリ上の FakeStore、Riot API 取得を FakeRiot（fake_riot.py）に
差し替える。
"""

import sys
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import datetime, timezone
from types import ModuleType
from typing import Any
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from schemas.riot_fetch import FailedFetch
from schemas.summoner_store import (
    BackfillState,
    BanRecord,
    MatchRecord,
    ParticipantRecord,
    SeasonRecord,
    SummonerRecord,
)
from tests.enrich_fakes import EnrichFakes
from tests.fake_riot import PUUID, FakeRiot

STORE_FUNCTIONS = (
    "find_summoner",
    "find_summoner_by_puuid",
    "upsert_summoner",
    "update_last_updated_at",
    "update_backfill_state",
    "try_start_backfill",
    "filter_unsaved_match_ids",
    "get_match_end_times",
    "save_matches",
    "get_recent_participations",
    "get_participations_between",
    "get_current_season",
)
FAILED_STORE_FUNCTIONS = (
    "get_gave_up_match_ids",
    "record_failed_matches",
    "delete_failed_matches",
)
ENRICH_STORE_FUNCTIONS = ("get_enrichment_targets",)
RANK_STORE_FUNCTIONS = ("get_latest_snapshot", "insert_snapshot")
MEMBER_STORE_FUNCTIONS = ("get_members_by_match",)


def install_store_stub() -> ModuleType:
    """adapters.summoner_store を（未登録なら）スタブとして登録する。

    本物は import 時に Supabase クライアントを作るため、環境変数なしでは読み込めない。
    """
    module = _install_stub("adapters.summoner_store", STORE_FUNCTIONS)
    _install_stub("adapters.failed_match_store", FAILED_STORE_FUNCTIONS)
    _install_stub("adapters.enrich_store", ENRICH_STORE_FUNCTIONS)
    _install_stub("adapters.rank_snapshot_store", RANK_STORE_FUNCTIONS)
    _install_stub("adapters.match_member_store", MEMBER_STORE_FUNCTIONS)
    _install_stub("adapters.match_rank_store", ("get_ranks",))
    _install_stub("adapters.season_store", ("get_earliest_start_at",))
    return module


def _install_stub(module_name: str, functions: tuple[str, ...]) -> ModuleType:
    module = sys.modules.get(module_name)
    if module is None:
        module = ModuleType(module_name)
        sys.modules[module_name] = module
    for name in functions:
        if not hasattr(module, name):
            setattr(module, name, AsyncMock())
    return module


def summoner_record(**overrides: Any) -> SummonerRecord:
    fields: dict[str, Any] = {
        "puuid": PUUID,
        "region": "JP",
        "game_name": "TestUser",
        "tag_line": "JP1",
        "riot_id_lower": "testuser#jp1",
        "level": 100,
        "profile_icon_id": 7,
        "solo_tier": "GOLD",
        "solo_rank": "II",
        "solo_lp": 50,
        "solo_wins": 10,
        "solo_losses": 5,
        "last_updated_at": datetime(2025, 1, 1, tzinfo=timezone.utc),
    }
    fields.update(overrides)
    return SummonerRecord.model_validate(fields)


class FakeStore(EnrichFakes):
    """Summoner_Store の代役。保存内容をメモリに持ち、呼び出しを記録する。"""

    def __init__(
        self,
        record: SummonerRecord | None = None,
        saved: dict[str, datetime] | None = None,
        can_start_backfill: bool = True,
    ) -> None:
        super().__init__()
        self.records = {record.puuid: record} if record else {}
        self.saved: dict[str, datetime] = dict(saved or {})
        self.can_start_backfill = can_start_backfill
        self.upserts: list[SummonerRecord] = []
        self.touches: list[datetime] = []
        self.state_updates: list[BackfillState] = []
        self.save_calls: list[list[str]] = []
        self.saved_matches: list[MatchRecord] = []
        self.saved_bans: list[BanRecord] = []
        # failed_matches: match_id -> (attempts, last_error, gave_up)
        self.failed: dict[str, tuple[int, str, bool]] = {}

    async def find_summoner(self, region: str, riot_id_lower: str) -> Any:
        for record in self.records.values():
            if record.riot_id_lower == riot_id_lower:
                return record
        return None

    async def find_summoner_by_puuid(self, puuid: str, region: str) -> Any:
        return self.records.get(puuid)

    async def upsert_summoner(self, record: SummonerRecord) -> None:
        """本物と同じく、既存行のカーソル列は上書きしない。"""
        self.upserts.append(record)
        existing = self.records.get(record.puuid)
        if existing is not None:
            cursors = BackfillState(
                synced_until=existing.synced_until,
                backfill_cursor=existing.backfill_cursor,
                backfill_completed=existing.backfill_completed,
            )
            record = record.model_copy(update=cursors.model_dump())
        self.records[record.puuid] = record

    async def update_last_updated_at(
        self, puuid: str, region: str, last_updated_at: datetime
    ) -> None:
        """last_updated_at だけを更新する（他の列は変更しない）。"""
        self.touches.append(last_updated_at)
        self.records[puuid] = self.records[puuid].model_copy(
            update={"last_updated_at": last_updated_at}
        )

    async def get_gave_up_match_ids(self, match_ids: list[str]) -> set[str]:
        return {m for m in match_ids if m in self.failed and self.failed[m][2]}

    async def record_failed_matches(
        self, failures: list[FailedFetch], max_attempts: int
    ) -> set[str]:
        for f in failures:
            attempts, _, gave_up = self.failed.get(f.match_id, (0, "", False))
            attempts += 1
            self.failed[f.match_id] = (
                attempts,
                f.error,
                gave_up or attempts >= max_attempts,
            )
        return {f.match_id for f in failures if self.failed[f.match_id][2]}

    async def delete_failed_matches(self, match_ids: list[str]) -> None:
        for match_id in match_ids:
            self.failed.pop(match_id, None)

    async def update_backfill_state(
        self, puuid: str, region: str, state: BackfillState
    ) -> None:
        self.state_updates.append(state)
        self.records[puuid] = self.records[puuid].model_copy(update=state.model_dump())

    async def try_start_backfill(self, puuid: str, region: str) -> bool:
        return self.can_start_backfill

    async def filter_unsaved_match_ids(self, match_ids: list[str]) -> list[str]:
        return [m for m in match_ids if m not in self.saved]

    async def get_match_end_times(self, match_ids: list[str]) -> dict[str, datetime]:
        return {m: self.saved[m] for m in match_ids if m in self.saved}

    async def save_matches(
        self,
        matches: list[MatchRecord],
        participants: list[ParticipantRecord],
        bans: list[BanRecord] | None = None,
    ) -> None:
        self.save_calls.append([m.match_id for m in matches])
        self.saved_matches.extend(matches)
        self.saved_bans.extend(bans or [])
        self.apply_saved(matches)
        for m in matches:
            self.saved[m.match_id] = m.game_end_at

    async def get_recent_participations(self, puuid: str, limit: int) -> list[Any]:
        return []

    async def get_participations_between(
        self, puuid: str, start: datetime | None, end: datetime | None
    ) -> list[Any]:
        return []

    async def get_current_season(self) -> SeasonRecord | None:
        return None


@contextmanager
def installed(store: FakeStore, riot: FakeRiot) -> Iterator[None]:
    """services が使う Summoner_Store と riot_fetch の関数を代役に差し替える。"""
    from services.summoner import backfill_page, enrich, rank_record, riot_fetch, sync

    with pytest.MonkeyPatch.context() as mp:
        for name in STORE_FUNCTIONS:
            mp.setattr(sync.summoner_store, name, getattr(store, name), raising=False)
        for name in FAILED_STORE_FUNCTIONS:
            mp.setattr(
                backfill_page.failed_match_store,
                name,
                getattr(store, name),
                raising=False,
            )
        for name in ENRICH_STORE_FUNCTIONS:
            mp.setattr(enrich.enrich_store, name, getattr(store, name), raising=False)
        for name in RANK_STORE_FUNCTIONS:
            mp.setattr(
                rank_record.rank_snapshot_store,
                name,
                getattr(store, name),
                raising=False,
            )
        for name in (
            "fetch_league",
            "fetch_account_by_riot_id",
            "fetch_account_by_puuid",
            "fetch_profile",
            "fetch_ranked_match_ids",
            "fetch_match_details",
        ):
            mp.setattr(riot_fetch, name, getattr(riot, name))
        yield


def http_error(status_code: int) -> HTTPException:
    return HTTPException(status_code=status_code, detail="error")
