"""ランクの記録（summoner_rank_snapshots）のテスト。初回登録・更新・変更検知での記録。

FakeRiot の league は ソロ GOLD I 77LP 20勝10敗。フレックスはテストごとに設定する。

_Requirements: 4.9_
"""

import asyncio
from datetime import datetime, timezone

import pytest

from schemas.riot_fetch import LeagueInfo
from schemas.summoner import RankData
from tests.fake_riot import PUUID, FakeRiot, make_history
from tests.sync_helpers import (
    FakeStore,
    http_error,
    install_store_stub,
    installed,
    summoner_record,
)

install_store_stub()

from services.summoner.rank_record import record_rank_snapshots  # noqa: E402
from services.summoner.search import search_summoner  # noqa: E402
from services.summoner.update import update_summoner  # noqa: E402

_FLEX = {"flex_tier": "SILVER", "flex_rank": "III", "flex_lp": 10}


def _league(**overrides: object) -> LeagueInfo:
    fields: dict[str, object] = {
        "solo": RankData(
            queueType="RANKED_SOLO_5x5",
            tier="GOLD",
            rank="I",
            leaguePoints=77,
            wins=20,
            losses=10,
        ),
        "flex_wins": 3,
        "flex_losses": 2,
        **_FLEX,
    }
    fields.update(overrides)
    return LeagueInfo.model_validate(fields)


def _record(store: FakeStore, league: LeagueInfo) -> None:
    with installed(store, FakeRiot()):
        asyncio.run(record_rank_snapshots("JP", PUUID, league))


def _by_queue(store: FakeStore) -> dict[str, list[tuple[str, str, int, int, int]]]:
    result: dict[str, list[tuple[str, str, int, int, int]]] = {}
    for s in store.snapshots:
        row = (s.tier, s.rank, s.league_points, s.wins, s.losses)
        result.setdefault(s.queue_type, []).append(row)
    return result


def test_records_solo_and_flex_with_source() -> None:
    store = FakeStore()

    _record(store, _league())

    assert _by_queue(store) == {
        "RANKED_SOLO_5x5": [("GOLD", "I", 77, 20, 10)],
        "RANKED_FLEX_SR": [("SILVER", "III", 10, 3, 2)],
    }
    assert {s.source for s in store.snapshots} == {"summoner_update"}
    assert {(s.puuid, s.region) for s in store.snapshots} == {(PUUID, "JP")}
    assert all(s.fetched_at.tzinfo is not None for s in store.snapshots)


def test_unranked_queue_is_not_recorded() -> None:
    """エントリのない（UNRANKED の）キューは記録しない。"""
    store = FakeStore()

    _record(store, _league(flex_tier="UNRANKED", flex_rank="", flex_lp=0))

    assert list(_by_queue(store)) == ["RANKED_SOLO_5x5"]


def test_same_as_latest_is_not_recorded_again() -> None:
    store = FakeStore()

    _record(store, _league())
    _record(store, _league())

    assert len(store.snapshots) == 2  # ソロとフレックスが1件ずつ


@pytest.mark.parametrize(
    "change",
    [
        {"flex_lp": 11},
        {"flex_wins": 4},
        {"flex_losses": 3},
        {"flex_rank": "II"},
        {"flex_tier": "GOLD"},
    ],
)
def test_changed_queue_is_recorded_without_touching_the_other(
    change: dict[str, object],
) -> None:
    """tier・rank・LP・勝敗数のどれかが変わったキューだけ、新しく記録する。"""
    store = FakeStore()
    _record(store, _league())

    _record(store, _league(**change))

    by_queue = _by_queue(store)
    assert len(by_queue["RANKED_SOLO_5x5"]) == 1
    assert len(by_queue["RANKED_FLEX_SR"]) == 2


def test_compares_with_latest_not_with_older_records() -> None:
    """直前の記録と比べる（A→B→A は、最後の A も記録する）。"""
    store = FakeStore()

    _record(store, _league(flex_lp=10))
    _record(store, _league(flex_lp=20))
    _record(store, _league(flex_lp=10))

    assert [row[2] for row in _by_queue(store)["RANKED_FLEX_SR"]] == [10, 20, 10]


def test_store_failure_is_logged_and_not_raised(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    """記録の失敗は検索・更新を止めない。"""
    store = FakeStore()

    async def _broken(record: object) -> None:
        raise RuntimeError("db down")

    monkeypatch.setattr(store, "insert_snapshot", _broken)

    _record(store, _league())

    assert any("ランクの記録に失敗" in r.getMessage() for r in caplog.records)


# ---------------------------------------------------------------------------
# 初回登録・更新・変更検知からの記録
# ---------------------------------------------------------------------------


def _riot_with_flex(history_size: int = 0) -> FakeRiot:
    riot = FakeRiot(history=make_history(history_size))
    riot.league = riot.league.model_copy(update=_FLEX)
    return riot


def test_first_registration_records_ranks_with_one_league_request() -> None:
    """初回登録: 取得した league entries（1回）でソロ・フレックスを記録する。"""
    store = FakeStore()
    riot = _riot_with_flex()

    with installed(store, riot):
        asyncio.run(search_summoner("JP", "TestUser", "JP1"))

    assert riot.calls.count("league") == 1
    assert set(_by_queue(store)) == {"RANKED_SOLO_5x5", "RANKED_FLEX_SR"}


def test_search_of_registered_summoner_records_nothing() -> None:
    """登録済みの検索は Riot API を呼ばないため、記録もしない。"""
    store = FakeStore(record=summoner_record())

    with installed(store, _riot_with_flex()):
        asyncio.run(search_summoner("JP", "TestUser", "JP1"))

    assert store.snapshots == []


def test_update_with_new_matches_records_ranks() -> None:
    store = FakeStore(record=summoner_record())
    riot = _riot_with_flex(history_size=2)

    with installed(store, riot):
        asyncio.run(update_summoner("JP", "TestUser", "JP1"))

    assert riot.calls.count("league") == 1
    assert set(_by_queue(store)) == {"RANKED_SOLO_5x5", "RANKED_FLEX_SR"}


def test_update_without_new_matches_still_records_ranks() -> None:
    """変更検知で「新しい試合なし」と判定した場合も、取得した league entries で記録する。"""
    store = FakeStore(
        record=summoner_record(
            solo_wins=20,
            solo_losses=10,
            flex_wins=3,
            flex_losses=2,
            last_updated_at=datetime(2025, 1, 1, tzinfo=timezone.utc),
        )
    )
    riot = _riot_with_flex()

    with installed(store, riot):
        asyncio.run(update_summoner("JP", "TestUser", "JP1"))

    assert riot.calls == ["league"]
    assert set(_by_queue(store)) == {"RANKED_SOLO_5x5", "RANKED_FLEX_SR"}


def test_update_failure_after_league_still_keeps_the_observed_rank() -> None:
    """league 取得後に更新が失敗しても、観測したランクの記録は残る。"""
    store = FakeStore(record=summoner_record())
    riot = _riot_with_flex()
    riot.profile_error = http_error(429)

    with installed(store, riot):
        with pytest.raises(Exception):
            asyncio.run(update_summoner("JP", "TestUser", "JP1"))

    assert len(store.snapshots) == 2
