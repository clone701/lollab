"""champion_stats_store のテスト: 条件の渡し方（リメイク除外・期間・キュー）とページング。

load_store で adapters/ のモジュールを読み込むため、test_router_properties.py
（sys.modules["adapters"] を差し替える）より前に収集されるファイル名にしている。
_Requirements: 2.1, 4.1〜4.4, 5.2_
"""

import asyncio
from datetime import datetime, timezone
from typing import Any

import pytest

from schemas.champion_store import StatsFilter
from tests.champion_helpers import CountClient, CountQuery
from tests.store_helpers import load_store

store = load_store("champion_stats_store.py")

SINCE = datetime(2026, 4, 1, tzinfo=timezone.utc)
LATEST = StatsFilter(queue_ids=[420, 440], patch="16.22")
RECENT = StatsFilter(queue_ids=[440], since=SINCE)
ALL = StatsFilter(queue_ids=[420])


def use(monkeypatch: pytest.MonkeyPatch, client: CountClient) -> CountClient:
    monkeypatch.setattr(store, "supabase", client)
    return client


def _row(**overrides: Any) -> dict[str, Any]:
    row: dict[str, Any] = {
        "win": True,
        "spell1_id": 4,
        "spell2_id": 14,
        "primary_style_id": 8100,
        "sub_style_id": 8200,
    }
    row.update(overrides)
    return row


def _eq(query: CountQuery) -> dict[str, Any]:
    return {args[0]: args[1] for args in query.args_of("eq")}


# --- 条件の渡し方 ---


def test_scope_excludes_remakes_and_sets_queue_and_patch(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = use(monkeypatch, CountClient([]))

    asyncio.run(store.get_build_rows("LeeSin", "JUNGLE", LATEST))

    table, query = client.tables[0]
    assert table == "match_participants"
    assert _eq(query) == {
        "champion_name": "LeeSin",
        "is_remake": False,
        "patch": "16.22",
        "team_position": "JUNGLE",
    }
    assert query.args_of("in_") == [("queue_id", [420, 440])]
    assert query.args_of("gte") == []


def test_scope_with_since_and_without_patch(monkeypatch: pytest.MonkeyPatch) -> None:
    client = use(monkeypatch, CountClient([]))

    asyncio.run(store.get_build_rows("LeeSin", "JUNGLE", RECENT))

    query = client.tables[0][1]
    assert "patch" not in _eq(query)
    assert query.args_of("gte") == [("game_end_at", SINCE.isoformat())]
    assert query.args_of("in_") == [("queue_id", [440])]


def test_scope_for_all_period_has_no_period_condition(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = use(monkeypatch, CountClient([]))

    asyncio.run(store.get_build_rows("LeeSin", None, ALL))

    query = client.tables[0][1]
    assert _eq(query) == {"champion_name": "LeeSin", "is_remake": False}
    assert query.args_of("gte") == []


def test_get_build_rows_selects_only_needed_columns(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = use(monkeypatch, CountClient([_row(skill_order=[1, 2])]))

    rows = asyncio.run(store.get_build_rows("LeeSin", "TOP", ALL))

    columns = client.tables[0][1].args_of("select")[0][0].split(",")
    assert "puuid" not in columns and "*" not in columns
    assert {"win", "skill_order", "completed_items", "primary_perk_ids"} <= set(columns)
    assert rows[0].skill_order == [1, 2]
    assert rows[0].starting_items is None


def test_get_build_rows_pages_through_all_rows(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = use(monkeypatch, CountClient([_row()] * 1000, [_row()] * 3))

    rows = asyncio.run(store.get_build_rows("LeeSin", "TOP", ALL))

    assert len(rows) == 1003
    assert [q.args_of("range")[0] for _, q in client.tables] == [
        (0, 999),
        (1000, 1999),
    ]


# --- ロール別の試合数 ---


def test_count_role_games_excludes_empty_role(monkeypatch: pytest.MonkeyPatch) -> None:
    pages = [{"team_position": p} for p in ["TOP", "", "TOP", "MIDDLE", ""]]
    client = use(monkeypatch, CountClient(pages))

    result = asyncio.run(store.count_role_games("Ahri", LATEST))

    assert result == {"TOP": 2, "MIDDLE": 1}
    query = client.tables[0][1]
    assert _eq(query)["is_remake"] is False
    assert _eq(query)["patch"] == "16.22"


# --- 件数 ---


def test_get_role_win_totals_counts_total_and_wins(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = use(monkeypatch, CountClient(120, 61))

    result = asyncio.run(store.get_role_win_totals("TOP", LATEST))

    assert result == (120, 61)
    (_, total_query), (_, wins_query) = client.tables
    assert _eq(total_query) == {
        "team_position": "TOP",
        "is_remake": False,
        "patch": "16.22",
    }
    assert _eq(wins_query) == {**_eq(total_query), "win": True}
    assert "champion_name" not in _eq(total_query)


def test_count_matches_filters_matches_table(monkeypatch: pytest.MonkeyPatch) -> None:
    client = use(monkeypatch, CountClient(500))

    result = asyncio.run(store.count_matches(RECENT))

    assert result == 500
    table, query = client.tables[0]
    assert table == "matches"
    assert _eq(query) == {"is_remake": False}
    assert query.args_of("in_") == [("queue_id", [440])]
    assert query.args_of("gte") == [("game_end_at", SINCE.isoformat())]


def test_count_bans_filters_on_embedded_matches(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = use(monkeypatch, CountClient(37))

    result = asyncio.run(store.count_bans(64, LATEST))

    assert result == 37
    table, query = client.tables[0]
    assert table == "match_bans"
    assert "matches!inner" in query.args_of("select")[0][0]
    assert _eq(query) == {
        "champion_id": 64,
        "matches.is_remake": False,
        "matches.patch": "16.22",
    }
    assert query.args_of("in_") == [("matches.queue_id", [420, 440])]


def test_count_returns_zero_when_count_is_missing(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    use(monkeypatch, CountClient([]))

    assert asyncio.run(store.count_matches(ALL)) == 0


# --- champion_id ---


def test_get_champion_id(monkeypatch: pytest.MonkeyPatch) -> None:
    client = use(monkeypatch, CountClient([{"champion_id": 64}], []))

    assert asyncio.run(store.get_champion_id("LeeSin")) == 64
    assert asyncio.run(store.get_champion_id("Nobody")) is None
    assert _eq(client.tables[0][1]) == {"champion_name": "LeeSin"}


# --- 最新パッチ ---


def test_latest_patch_compares_numerically(monkeypatch: pytest.MonkeyPatch) -> None:
    """直近の試合のパッチを数値で比較する（文字列順では "16.9" > "16.22"）。"""
    client = use(
        monkeypatch,
        CountClient([{"patch": "16.9"}, {"patch": "16.22"}, {"patch": "15.24"}]),
    )

    assert asyncio.run(store.get_latest_patch()) == "16.22"
    assert len(client.tables) == 1


def test_latest_patch_uses_recent_matches(monkeypatch: pytest.MonkeyPatch) -> None:
    """終了日時の新しい順に、パッチのある試合だけを一定件数取得する。"""
    client = use(monkeypatch, CountClient([{"patch": "16.22"}]))

    asyncio.run(store.get_latest_patch())

    ((_, query),) = client.tables
    assert ("patch", "not.is", "null") in query.args_of("filter")
    assert query.args_of("limit") == [(50,)]


def test_latest_patch_is_none_without_matches(monkeypatch: pytest.MonkeyPatch) -> None:
    use(monkeypatch, CountClient([]))

    assert asyncio.run(store.get_latest_patch()) is None


def test_latest_patch_ignores_malformed_patch(monkeypatch: pytest.MonkeyPatch) -> None:
    use(monkeypatch, CountClient([{"patch": "abc"}, {"patch": "16.3"}]))

    assert asyncio.run(store.get_latest_patch()) == "16.3"
