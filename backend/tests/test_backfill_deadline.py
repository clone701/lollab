"""run_backfill の締め切りのテスト: 残りが少なければページの区切りで終了する。

_Requirements: 2.5_
"""

import asyncio
import time
from collections.abc import Callable
from datetime import datetime, timezone

import pytest

from services.summoner import deadline
from tests.fake_riot import PUUID, FakeRiot, make_history, match_time
from tests.sync_helpers import (
    FakeStore,
    install_store_stub,
    installed,
    summoner_record,
)

install_store_stub()

from services.summoner.backfill import run_backfill  # noqa: E402

_TARGET_TIME = datetime(2024, 1, 1, tzinfo=timezone.utc)


def _near_after(pages_allowed: int) -> Callable[[float | None], bool]:
    """is_near の代役: 最初の pages_allowed 回は False、その後は True。"""
    calls = {"count": 0}

    def is_near(_: float | None) -> bool:
        calls["count"] += 1
        return calls["count"] > pages_allowed

    return is_near


def _run(store: FakeStore, riot: FakeRiot, deadline_value: float | None = 1.0) -> None:
    with installed(store, riot):
        asyncio.run(run_backfill("JP", PUUID, deadline_value))


def test_margin_is_30_seconds() -> None:
    now = time.monotonic()
    assert deadline.is_near(now + 29) is True
    assert deadline.is_near(now + 31) is False
    assert deadline.is_near(None) is False


def test_from_remaining_ms_converts_to_monotonic() -> None:
    value = deadline.from_remaining_ms(60_000)
    assert 59 < value - time.monotonic() <= 60


def test_older_phase_stops_at_page_boundary_with_cursor_of_saved_pages(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """1ページ目を保存してカーソルを進め、2ページ目の前で終了する。"""
    monkeypatch.setattr(deadline, "is_near", _near_after(1))
    store = FakeStore(record=summoner_record())
    store.add_target("JP1_900", _TARGET_TIME)
    riot = FakeRiot(history=make_history(250), extra_times={"JP1_900": _TARGET_TIME})

    _run(store, riot)

    assert riot.requested_details == [f"JP1_{i}" for i in range(100)]
    state = store.state_updates[-1]
    assert state.backfill_cursor == match_time(99)
    assert state.backfill_completed is False
    assert "JP1_900" in store.targets  # 補完には進まない


def test_older_phase_resumes_from_cursor_next_time(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """締め切りで止まった後、次の実行は保存済みのカーソルから続きを取得する。"""
    store = FakeStore(record=summoner_record())
    riot = FakeRiot(history=make_history(250))
    monkeypatch.setattr(deadline, "is_near", _near_after(1))
    _run(store, riot)

    monkeypatch.setattr(deadline, "is_near", lambda _: False)
    riot.id_calls.clear()
    riot.detail_calls.clear()
    _run(store, riot, None)

    assert riot.id_calls[0]["end_time"] == match_time(99)
    assert store.records[PUUID].backfill_completed is True
    assert len(store.saved) == 250


def test_newer_phase_stops_without_advancing_synced_until(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(deadline, "is_near", _near_after(1))
    store = FakeStore(record=summoner_record(synced_until=match_time(249)))
    riot = FakeRiot(history=make_history(250))

    _run(store, riot)

    assert len(riot.requested_details) == 100
    assert store.state_updates == []
    assert store.records[PUUID].synced_until == match_time(249)


def test_already_near_deadline_does_nothing(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(deadline, "is_near", lambda _: True)
    store = FakeStore(record=summoner_record())
    riot = FakeRiot(history=make_history(5))

    _run(store, riot)

    assert riot.calls == [] and riot.id_calls == []
    assert store.state_updates == []


def test_enrichment_stops_when_near_deadline(monkeypatch: pytest.MonkeyPatch) -> None:
    store = FakeStore(record=summoner_record(backfill_completed=True))
    store.add_target("JP1_900", _TARGET_TIME)
    riot = FakeRiot(extra_times={"JP1_900": _TARGET_TIME})
    monkeypatch.setattr(deadline, "is_near", lambda _: True)

    _run(store, riot)

    assert riot.requested_details == []
    assert "JP1_900" in store.targets


def test_real_clock_deadline_ends_immediately() -> None:
    """残り30秒未満の実際の締め切りでも、何も取得せずに終了する。"""
    store = FakeStore(record=summoner_record())
    riot = FakeRiot(history=make_history(5))

    _run(store, riot, time.monotonic() + 5)

    assert riot.id_calls == []
