"""enrich.py（既存試合の補完フェーズ）のテスト。Riot API・DB・ストレージはモック。

_Requirements: 4.7_
"""

import asyncio

import pytest

from services.summoner.enrich import has_pending_targets, run_enrichment
from services.summoner.riot_fetch import RiotRateLimitError
from tests.fake_riot import FakeRiot, make_history, match_time
from tests.sync_helpers import FakeStore, install_store_stub, installed

install_store_stub()


def _setup(count: int, **riot_options: object) -> tuple[FakeStore, FakeRiot, list[str]]:
    """JP1_0（最新）〜 JP1_{count-1}（最古）が補完対象の FakeStore と FakeRiot。"""
    history = make_history(count)
    store = FakeStore()
    for match_id, ended_at in history:
        store.add_target(match_id, ended_at)
    riot = FakeRiot(history=history, **riot_options)  # type: ignore[arg-type]
    return store, riot, [m for m, _ in history]


def _run(store: FakeStore, riot: FakeRiot) -> None:
    with installed(store, riot):
        asyncio.run(run_enrichment())


def test_targets_are_fetched_oldest_first_and_cleared() -> None:
    """古い順に取得し、取り込めた試合は補完対象から外れる。優先度は backfill。"""
    store, riot, ids = _setup(5)

    _run(store, riot)

    assert riot.requested_details == list(reversed(ids))
    assert set(riot.detail_priorities) == {"backfill"}
    assert store.targets == {}
    assert store.failed == {}
    assert all(m.detail_version == 2 for m in store.saved_matches)
    assert all(m.timeline_fetched_at is not None for m in store.saved_matches)


def test_only_missing_parts_are_requested() -> None:
    """詳細が取り込み済みでタイムラインだけ欠けた試合は、timeline_only として取得する。"""
    store, riot, _ = _setup(3)
    store.add_target("JP1_1", match_time(1), needs_detail=False)

    _run(store, riot)

    assert riot.timeline_only_calls == [frozenset({"JP1_1"})]
    assert store.targets == {}


def test_pages_through_all_targets_in_order() -> None:
    """1ページ（50件）を超える対象も、古い順に最後まで処理する。同じ試合を繰り返さない。"""
    store, riot, ids = _setup(120, fail_ids={"JP1_100"})

    _run(store, riot)

    assert riot.requested_details == list(reversed(ids))
    assert set(store.targets) == {"JP1_100"}
    assert store.failed["JP1_100"][0] == 1


def test_rate_limit_ends_run_after_saving_fetched_matches() -> None:
    """予約枠に達したら、取得済みの試合を保存して例外で終了する。残りは次回に回る。"""
    store, riot, ids = _setup(5, rate_limit_after=2)

    with installed(store, riot):
        with pytest.raises(RiotRateLimitError):
            asyncio.run(run_enrichment())

    oldest_first = list(reversed(ids))
    assert [m.match_id for m in store.saved_matches] == oldest_first[:2]
    assert set(store.targets) == set(oldest_first[2:])
    assert len(riot.detail_calls) == 1


def test_failures_are_counted_and_give_up_after_three_attempts() -> None:
    """取得に失敗した試合は回数を数え、3回で補完対象から外す（他の試合は続ける）。"""
    store, riot, ids = _setup(3, fail_ids={"JP1_1"})

    for attempt in (1, 2):
        _run(store, riot)
        assert store.failed["JP1_1"] == (attempt, "HTTP 500", attempt >= 3)
    assert set(store.targets) == {"JP1_1"}

    _run(store, riot)
    assert store.failed["JP1_1"] == (3, "HTTP 500", True)

    riot.detail_calls.clear()
    _run(store, riot)
    assert riot.detail_calls == []  # 取得不能の試合は再試行しない
    assert not has_pending(store, riot)


def test_timeline_failure_keeps_detail_and_counts_attempts() -> None:
    """タイムラインだけ失敗した試合は、詳細を保存し、失敗を数え、3回で対象から外す。"""
    store, riot, _ = _setup(2, timeline_fail_ids={"JP1_0"})

    _run(store, riot)

    assert "JP1_1" not in store.targets
    assert store.targets["JP1_0"].needs_detail is False
    assert store.targets["JP1_0"].needs_timeline is True
    assert store.failed["JP1_0"][0] == 1

    _run(store, riot)
    _run(store, riot)
    assert store.failed["JP1_0"] == (3, "HTTP 500", True)
    assert not has_pending(store, riot)


def test_success_removes_failed_record() -> None:
    store, riot, _ = _setup(1)
    store.failed["JP1_0"] = (2, "HTTP 500", False)

    _run(store, riot)

    assert store.failed == {}
    assert store.targets == {}


def test_unknown_region_is_counted_as_failure_without_riot_call() -> None:
    store, riot, _ = _setup(1)
    store.add_target("XX9_1", match_time(5))

    _run(store, riot)

    assert store.failed["XX9_1"] == (1, "UnknownRegion", False)
    assert riot.requested_details == ["JP1_0"]


def has_pending(store: FakeStore, riot: FakeRiot) -> bool:
    with installed(store, riot):
        return asyncio.run(has_pending_targets())


def test_has_pending_targets() -> None:
    """対象があれば True。対象がない、または全て取得不能（gave_up）なら False。"""
    store, riot, _ = _setup(2)
    assert has_pending(store, riot) is True

    store.failed = {"JP1_0": (3, "HTTP 500", True), "JP1_1": (3, "HTTP 500", True)}
    assert has_pending(store, riot) is False

    store.targets.clear()
    assert has_pending(store, riot) is False
