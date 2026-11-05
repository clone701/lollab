"""search.py のユニットテスト（Summoner_Store と Riot API 取得はモック）。

_Requirements: 1.2, 1.4, 2.1, 2.3, 2.4, 2.5_
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

from services.summoner.search import search_summoner  # noqa: E402

# ---------------------------------------------------------------------------
# 登録済み
# ---------------------------------------------------------------------------


def test_registered_summoner_does_not_call_riot_api() -> None:
    """登録済みなら Riot API を一切呼ばず、Backfill 用 PUUID は None。"""
    store = FakeStore(record=summoner_record())
    riot = FakeRiot(history=make_history(5))

    with installed(store, riot):
        detail, puuid = asyncio.run(search_summoner("JP", "TestUser", "JP1"))

    assert riot.calls == []
    assert puuid is None
    assert detail.summoner.name == "TestUser"
    assert store.upserts == []


def test_registered_lookup_ignores_case() -> None:
    """大文字・小文字を区別せずに照合する。"""
    store = FakeStore(record=summoner_record())
    riot = FakeRiot()

    with installed(store, riot):
        detail, puuid = asyncio.run(search_summoner("JP", "TESTUSER", "jp1"))

    assert riot.calls == []
    assert puuid is None
    assert detail.summoner.tagLine == "JP1"


# ---------------------------------------------------------------------------
# 初回登録
# ---------------------------------------------------------------------------


def test_unregistered_summoner_is_registered() -> None:
    """未登録なら Riot API から取得して登録し、Backfill 用 PUUID を返す。"""
    store = FakeStore()
    riot = FakeRiot(history=make_history(30))

    with installed(store, riot):
        before = datetime.now(timezone.utc)
        detail, puuid = asyncio.run(search_summoner("JP", "TestUser", "JP1"))

    assert puuid == PUUID
    assert len(store.upserts) == 1
    record = store.upserts[0]
    assert (record.puuid, record.game_name, record.riot_id_lower) == (
        PUUID,
        "TestUser",
        "testuser#jp1",
    )
    assert (record.level, record.solo_tier, record.solo_lp) == (123, "GOLD", 77)
    assert record.last_updated_at >= before
    assert riot.id_calls[0]["start"] == 0 and riot.id_calls[0]["count"] == 20
    assert riot.requested_details == [f"JP1_{i}" for i in range(20)]
    assert sorted(store.saved) == sorted(f"JP1_{i}" for i in range(20))
    assert detail.summoner.level == 123


def test_registration_saves_flex_wins_and_losses() -> None:
    """初回登録でもフレックスの勝敗数を保存する。"""
    store = FakeStore()
    riot = FakeRiot(history=make_history(3))

    with installed(store, riot):
        asyncio.run(search_summoner("JP", "TestUser", "JP1"))

    assert (store.upserts[0].flex_wins, store.upserts[0].flex_losses) == (3, 2)


def test_registration_writes_initial_cursor() -> None:
    """20件取得したら、最新を synced_until、最古を backfill_cursor にする。"""
    store = FakeStore()
    riot = FakeRiot(history=make_history(30))

    with installed(store, riot):
        asyncio.run(search_summoner("JP", "TestUser", "JP1"))

    assert len(store.state_updates) == 1
    state = store.state_updates[0]
    assert state.synced_until == match_time(0)
    assert state.backfill_cursor == match_time(19)
    assert state.backfill_completed is False


def test_registration_cursor_covers_saved_matches() -> None:
    """保存済みで詳細を取得しなかった試合も含めてカーソルを求める。"""
    saved = {"JP1_0": match_time(0), "JP1_19": match_time(19)}
    store = FakeStore(saved=saved)
    riot = FakeRiot(history=make_history(20))

    with installed(store, riot):
        asyncio.run(search_summoner("JP", "TestUser", "JP1"))

    assert "JP1_0" not in riot.requested_details
    assert "JP1_19" not in riot.requested_details
    state = store.state_updates[0]
    assert (state.synced_until, state.backfill_cursor) == (
        match_time(0),
        match_time(19),
    )


def test_registration_with_fewer_than_20_matches_completes_backfill() -> None:
    """20件未満なら backfill_completed = true。"""
    store = FakeStore()
    riot = FakeRiot(history=make_history(5))

    with installed(store, riot):
        asyncio.run(search_summoner("JP", "TestUser", "JP1"))

    state = store.state_updates[0]
    assert state.backfill_completed is True
    assert state.synced_until == match_time(0)
    assert state.backfill_cursor == match_time(4)


def test_registration_with_no_matches() -> None:
    """試合が0件なら、synced_until を登録時刻にし、backfill_completed = true。"""
    store = FakeStore()
    riot = FakeRiot(history=[])

    with installed(store, riot):
        _, puuid = asyncio.run(search_summoner("JP", "TestUser", "JP1"))

    assert puuid == PUUID
    assert riot.detail_calls == []
    state = store.state_updates[0]
    assert state.synced_until == store.upserts[0].last_updated_at
    assert state.backfill_cursor is None
    assert state.backfill_completed is True


# ---------------------------------------------------------------------------
# RiotId の変更（PUUID 既存）
# ---------------------------------------------------------------------------


def test_existing_puuid_updates_riot_id_and_keeps_cursor() -> None:
    """PUUID が登録済みなら RiotId を更新し、カーソルは変更しない。"""
    old = summoner_record(
        game_name="OldName",
        riot_id_lower="oldname#jp1",
        synced_until=match_time(3),
        backfill_cursor=match_time(40),
        backfill_completed=True,
    )
    store = FakeStore(record=old)
    riot = FakeRiot(history=make_history(30))
    riot.account.game_name = "NewName"

    with installed(store, riot):
        detail, puuid = asyncio.run(search_summoner("JP", "NewName", "JP1"))

    assert puuid == PUUID
    assert store.state_updates == []
    assert len(store.upserts) == 1
    assert store.upserts[0].game_name == "NewName"
    assert store.upserts[0].riot_id_lower == "newname#jp1"
    kept = store.records[PUUID]
    assert kept.game_name == "NewName"
    assert (kept.synced_until, kept.backfill_cursor) == (match_time(3), match_time(40))
    assert kept.backfill_completed is True
    assert detail.summoner.name == "NewName"


# ---------------------------------------------------------------------------
# エラー
# ---------------------------------------------------------------------------


def test_account_not_found_saves_nothing() -> None:
    """アカウント未発見の 404 は何も保存せずそのまま返す。"""
    store = FakeStore()
    riot = FakeRiot()
    riot.account_error = http_error(404)

    with installed(store, riot):
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(search_summoner("JP", "TestUser", "JP1"))

    assert exc_info.value.status_code == 404
    assert store.upserts == [] and store.saved == {}
    assert riot.calls == ["account_by_riot_id"]


def test_rate_limit_saves_fetched_matches_and_does_not_register() -> None:
    """試合取得中の 429 は、取得済みの試合を保存してから 429 に変換する。"""
    store = FakeStore()
    riot = FakeRiot(history=make_history(20), rate_limit_after=3)

    with installed(store, riot):
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(search_summoner("JP", "TestUser", "JP1"))

    assert exc_info.value.status_code == 429
    assert sorted(store.saved) == ["JP1_0", "JP1_1", "JP1_2"]
    assert store.upserts == [] and store.state_updates == []


def test_match_ids_error_is_converted_to_502() -> None:
    """試合ID一覧の 5xx は 502 に変換し、登録しない。"""
    store = FakeStore()
    riot = FakeRiot()
    riot.ids_error = status_error(500)

    with installed(store, riot):
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(search_summoner("JP", "TestUser", "JP1"))

    assert exc_info.value.status_code == 502
    assert store.upserts == []
