"""champion_stats_store のランク帯の絞り込みのテスト。

参加者の集計・ロール別件数・ロール全体の勝敗は match_participants.rank_tier、
試合総数は matches.rank_tier、BAN 数は matches との内部結合の rank_tier で絞る。
all（rank_tiers が None）では rank_tier の条件を付けない。
load_store を使うため、ファイル名は test_champion_store.py と同じ理由で
test_router_properties.py より前に収集される名前にしている。

_Requirements: champion-stats 4.3, 4.4_
"""

import asyncio
from typing import Any

import pytest

from schemas.champion_store import StatsFilter
from tests.champion_helpers import CountClient, CountQuery
from tests.store_helpers import load_store

store = load_store("champion_stats_store.py")

TIERS = ["DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER"]
DIAMOND_PLUS = StatsFilter(queue_ids=[420], patch="16.22", rank_tiers=TIERS)
NO_RANK = StatsFilter(queue_ids=[420], patch="16.22")


def _use(monkeypatch: pytest.MonkeyPatch, client: CountClient) -> CountClient:
    monkeypatch.setattr(store, "supabase", client)
    return client


def _rank_conditions(query: CountQuery, column: str = "rank_tier") -> list[Any]:
    return [args for args in query.args_of("in_") if args[0] == column]


def test_participant_queries_filter_on_participant_rank_tier(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = _use(monkeypatch, CountClient([], [], 0, 0))

    asyncio.run(store.get_build_rows("Ahri", "MIDDLE", DIAMOND_PLUS))
    asyncio.run(store.count_role_games("Ahri", DIAMOND_PLUS))
    asyncio.run(store.get_role_win_totals("MIDDLE", DIAMOND_PLUS))

    assert [name for name, _ in client.tables] == ["match_participants"] * 4
    for _, query in client.tables:
        assert _rank_conditions(query) == [("rank_tier", TIERS)]


def test_count_matches_filters_on_matches_rank_tier(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = _use(monkeypatch, CountClient(10))

    asyncio.run(store.count_matches(DIAMOND_PLUS))

    table, query = client.tables[0]
    assert table == "matches"
    assert _rank_conditions(query) == [("rank_tier", TIERS)]


def test_count_bans_filters_on_embedded_matches_rank_tier(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = _use(monkeypatch, CountClient(3))

    asyncio.run(store.count_bans(64, DIAMOND_PLUS))

    table, query = client.tables[0]
    assert table == "match_bans"
    assert "matches!inner" in query.args_of("select")[0][0]
    assert _rank_conditions(query, "matches.rank_tier") == [
        ("matches.rank_tier", TIERS)
    ]
    # match_bans 自身には rank_tier の列がない
    assert _rank_conditions(query) == []


def test_all_adds_no_rank_condition(monkeypatch: pytest.MonkeyPatch) -> None:
    client = _use(monkeypatch, CountClient([], [], 0, 0, 0, 0))

    asyncio.run(store.get_build_rows("Ahri", "MIDDLE", NO_RANK))
    asyncio.run(store.count_role_games("Ahri", NO_RANK))
    asyncio.run(store.get_role_win_totals("MIDDLE", NO_RANK))
    asyncio.run(store.count_matches(NO_RANK))
    asyncio.run(store.count_bans(64, NO_RANK))

    for _, query in client.tables:
        assert all("rank_tier" not in args[0] for args in query.args_of("in_"))


def test_latest_patch_ignores_rank(monkeypatch: pytest.MonkeyPatch) -> None:
    """最新パッチの算出は、ランク帯の条件を持たない（全試合から決める）。"""
    client = _use(monkeypatch, CountClient([{"patch": "16.22"}]))

    assert asyncio.run(store.get_latest_patch()) == "16.22"
    assert _rank_conditions(client.tables[0][1]) == []
