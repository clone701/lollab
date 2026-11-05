"""update.py のユニットテスト（Summoner_Store と Riot API 取得はモック）。

_Requirements: 3.1, 3.2, 3.3, 3.7, 3.8_
"""

import asyncio
from datetime import datetime, timezone

import pytest
from fastapi import HTTPException

from tests.fake_riot import PUUID, FakeRiot, make_history, match_time
from tests.riot_fetch_helpers import status_error
from tests.sync_helpers import (
    FakeStore,
    http_error,
    install_store_stub,
    installed,
    summoner_record,
)

install_store_stub()

from services.summoner.update import update_summoner  # noqa: E402

_OLD_UPDATED_AT = datetime(2025, 1, 1, tzinfo=timezone.utc)


def _store(**record_overrides: object) -> FakeStore:
    return FakeStore(record=summoner_record(**record_overrides))


def test_unregistered_summoner_returns_404_without_riot_calls() -> None:
    """未登録なら Riot API を呼ばず 404。"""
    store = FakeStore()
    riot = FakeRiot(history=make_history(5))

    with installed(store, riot):
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(update_summoner("JP", "TestUser", "JP1"))

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "サモナーが見つかりません"
    assert riot.calls == []


def test_update_does_not_fetch_saved_matches() -> None:
    """保存済みの試合の詳細は取得せず、未保存分だけ取得する。"""
    saved = {f"JP1_{i}": match_time(i) for i in range(5)}
    store = FakeStore(record=summoner_record(), saved=saved)
    riot = FakeRiot(history=make_history(25))

    with installed(store, riot):
        _, puuid = asyncio.run(update_summoner("JP", "TestUser", "JP1"))

    assert puuid == PUUID
    assert riot.id_calls[0]["count"] == 20
    assert riot.requested_details == [f"JP1_{i}" for i in range(5, 20)]
    assert len(store.saved) == 20


def test_update_refreshes_profile_and_last_updated_at() -> None:
    """プロフィール・RiotId・last_updated_at を更新し、カーソルは変更しない。"""
    store = _store(
        synced_until=match_time(2),
        backfill_cursor=match_time(30),
        backfill_completed=True,
    )
    riot = FakeRiot(history=make_history(3))
    riot.account.game_name = "NewName"

    with installed(store, riot):
        before = datetime.now(timezone.utc)
        detail, _ = asyncio.run(update_summoner("JP", "TestUser", "JP1"))

    assert riot.calls[:3] == ["league", "account_by_puuid", "profile"]
    assert len(store.upserts) == 1
    updated = store.upserts[0]
    assert updated.game_name == "NewName"
    assert updated.riot_id_lower == "newname#jp1"
    assert updated.level == 123
    assert updated.last_updated_at >= before
    assert store.state_updates == []
    kept = store.records[PUUID]
    assert (kept.synced_until, kept.backfill_cursor) == (match_time(2), match_time(30))
    assert detail.summoner.level == 123


def test_rate_limit_keeps_fetched_matches_and_last_updated_at() -> None:
    """429 では取得済みの試合を保存し、upsert_summoner を呼ばずに 429 を返す。"""
    store = _store(last_updated_at=_OLD_UPDATED_AT)
    riot = FakeRiot(history=make_history(20), rate_limit_after=4)

    with installed(store, riot):
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(update_summoner("JP", "TestUser", "JP1"))

    assert exc_info.value.status_code == 429
    assert sorted(store.saved) == [f"JP1_{i}" for i in range(4)]
    assert store.upserts == []
    assert store.records[PUUID].last_updated_at == _OLD_UPDATED_AT


def test_match_ids_error_does_not_upsert() -> None:
    """試合ID一覧の 5xx は 502 に変換し、upsert_summoner を呼ばない。"""
    store = _store()
    riot = FakeRiot()
    riot.ids_error = status_error(500)

    with installed(store, riot):
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(update_summoner("JP", "TestUser", "JP1"))

    assert exc_info.value.status_code == 502
    assert store.upserts == []


def test_profile_error_does_not_upsert_or_fetch_matches() -> None:
    """プロフィール取得のエラーでは試合も取得せず、upsert_summoner を呼ばない。"""
    store = _store()
    riot = FakeRiot(history=make_history(5))
    riot.profile_error = http_error(429)

    with installed(store, riot):
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(update_summoner("JP", "TestUser", "JP1"))

    assert exc_info.value.status_code == 429
    assert "match_ids" not in riot.calls
    assert store.upserts == []
