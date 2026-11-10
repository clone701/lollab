"""build.py のテスト: 試合0件、概要の値（勝率差・ピック率・BAN率）。

ストアはスタブに差し替え、DB には接続しない。

_Requirements: 2.1, 3.6, 4.3, 4.4_
"""

import asyncio

import pytest

from schemas.champion import ChampionBuildResponse, Period
from tests.champion_helpers import Store, build_row, install_champion_store_stub

install_champion_store_stub()

from services.champion.build import get_champion_build  # noqa: E402


@pytest.fixture
def store(monkeypatch: pytest.MonkeyPatch) -> Store:
    return Store(monkeypatch)


def build(role: str | None = None, period: Period = "all") -> ChampionBuildResponse:
    return asyncio.run(get_champion_build("Ahri", role, period, "all", "all"))


# --- 試合0件 ---


def test_no_games_without_role_returns_empty_response(store: Store) -> None:
    store["count_role_games"].return_value = {}

    result = build()

    assert result.role is None
    assert result.roles == {}
    assert result.summary.games == 0
    assert result.summary.win_rate_delta == 0.0
    assert result.runes.games == 0
    assert result.runes.options == []
    store["get_build_rows"].assert_not_awaited()
    store["get_role_win_totals"].assert_not_awaited()


def test_no_games_keeps_ban_rate(store: Store) -> None:
    """ロールの試合がなくても、BAN率は試合総数に対して計算する。"""
    store["count_role_games"].return_value = {}
    store["count_bans"].return_value = 5

    result = build()

    assert result.summary.ban_rate == 0.25
    assert result.summary.pick_rate == 0.0


def test_explicit_role_without_games_keeps_role(store: Store) -> None:
    store["count_role_games"].return_value = {}
    store["get_build_rows"].return_value = []

    result = build(role="TOP")

    assert result.role == "TOP"
    assert result.summary.games == 0


def test_no_matches_in_db_for_latest_patch(store: Store) -> None:
    store["get_latest_patch"].return_value = None

    result = build(role="TOP", period="latest_patch")

    assert result.latest_patch is None
    assert result.role == "TOP"
    assert result.summary.games == 0
    assert result.skill_priority.games == 0
    store["count_role_games"].assert_not_awaited()
    store["get_build_rows"].assert_not_awaited()


def test_unknown_champion_id_gives_zero_ban_rate(store: Store) -> None:
    store["get_champion_id"].return_value = None

    result = build()

    assert result.summary.ban_rate == 0.0
    store["count_bans"].assert_not_awaited()


# --- 概要の値 ---


def test_summary_values(store: Store) -> None:
    store["get_build_rows"].return_value = [build_row(win=True)] * 3 + [
        build_row(win=False)
    ]
    store["count_role_games"].return_value = {"MIDDLE": 4}
    store["get_role_win_totals"].return_value = (100, 50)
    store["count_matches"].return_value = 20
    store["count_bans"].return_value = 5

    result = build(period="latest_patch")

    assert result.champion_name == "Ahri"
    assert (result.period, result.queue, result.latest_patch) == (
        "latest_patch",
        "all",
        "16.22",
    )
    summary = result.summary
    assert (summary.games, summary.wins) == (4, 3)
    assert summary.win_rate_delta == pytest.approx(0.25)
    assert summary.pick_rate == pytest.approx(0.2)
    assert summary.ban_rate == pytest.approx(0.25)
    assert result.core_items.games == 4
