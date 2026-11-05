"""build.py のテスト: 絞り込み条件の決定（期間・キュー）とストアへの受け渡し、ロール。

ストアはスタブに差し替え、DB には接続しない。

_Requirements: 2.2, 4.1〜4.3_
"""

import asyncio
from datetime import datetime, timedelta, timezone

import pytest

from schemas.champion import ChampionBuildResponse, Period, QueueFilter
from schemas.champion_store import StatsFilter
from tests.champion_helpers import Store, install_champion_store_stub

install_champion_store_stub()

from services.champion.build import get_champion_build, make_filters  # noqa: E402

NOW = datetime(2026, 5, 1, 12, 0, tzinfo=timezone.utc)


@pytest.fixture
def store(monkeypatch: pytest.MonkeyPatch) -> Store:
    return Store(monkeypatch)


def build(
    role: str | None = None, period: Period = "all", queue: QueueFilter = "all"
) -> ChampionBuildResponse:
    return asyncio.run(get_champion_build("Ahri", role, period, queue))


# --- make_filters ---


def test_make_filters_by_period_and_queue() -> None:
    latest = make_filters("latest_patch", "solo", "16.22", NOW)
    recent = make_filters("last_30_days", "flex", "16.22", NOW)
    everything = make_filters("all", "all", "16.22", NOW)

    assert latest == StatsFilter(queue_ids=[420], patch="16.22")
    assert recent == StatsFilter(queue_ids=[440], since=NOW - timedelta(days=30))
    assert everything == StatsFilter(queue_ids=[420, 440])


def test_make_filters_without_latest_patch_is_none() -> None:
    assert make_filters("latest_patch", "all", None, NOW) is None
    assert make_filters("all", "all", None, NOW) is not None


# --- 絞り込み条件がストアへ渡る ---


@pytest.mark.parametrize(
    "function",
    [
        "count_role_games",
        "get_build_rows",
        "get_role_win_totals",
        "count_matches",
        "count_bans",
    ],
)
def test_latest_patch_and_queue_are_passed_to_store(
    store: Store, function: str
) -> None:
    build(period="latest_patch", queue="solo")

    assert store.filters(function) == StatsFilter(queue_ids=[420], patch="16.22")


def test_last_30_days_passes_since_to_store(store: Store) -> None:
    before = datetime.now(timezone.utc)
    build(period="last_30_days", queue="flex")
    after = datetime.now(timezone.utc)

    filters = store.filters("get_build_rows")
    assert filters.queue_ids == [440]
    assert filters.patch is None
    assert filters.since is not None
    assert before - timedelta(days=30) <= filters.since <= after - timedelta(days=30)


def test_all_period_passes_no_period_condition(store: Store) -> None:
    build(period="all", queue="all")

    assert store.filters("get_build_rows") == StatsFilter(queue_ids=[420, 440])


def test_champion_and_role_are_passed_to_store(store: Store) -> None:
    build(role="TOP")

    assert store.args("count_role_games")[0] == "Ahri"
    assert store.args("get_build_rows")[:2] == ("Ahri", "TOP")
    assert store.args("get_role_win_totals")[0] == "TOP"
    assert store.args("get_champion_id") == ("Ahri",)
    assert store.args("count_bans")[0] == 64


# --- ロール ---


def test_role_defaults_to_most_played_role(store: Store) -> None:
    store["count_role_games"].return_value = {"TOP": 3, "MIDDLE": 5, "JUNGLE": 1}

    result = build()

    assert result.role == "MIDDLE"
    assert list(result.roles) == ["MIDDLE", "TOP", "JUNGLE"]
    assert store.args("get_build_rows")[1] == "MIDDLE"


def test_role_tie_is_broken_by_role_name(store: Store) -> None:
    store["count_role_games"].return_value = {"TOP": 4, "JUNGLE": 4}

    assert build().role == "JUNGLE"


def test_explicit_role_is_used_even_if_not_most_played(store: Store) -> None:
    store["count_role_games"].return_value = {"MIDDLE": 5, "TOP": 1}

    result = build(role="TOP")

    assert result.role == "TOP"
    assert store.args("get_build_rows")[1] == "TOP"
    assert result.roles == {"MIDDLE": 5, "TOP": 1}
