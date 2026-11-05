"""backfill.py のテスト（Summoner_Store と Riot API 取得はモック）。

_Requirements: 2.2, 3.4, 3.5, 3.6_
"""

import asyncio
from typing import Any

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from services.summoner.riot_fetch import RiotRateLimitError
from tests.fake_riot import PUUID, FakeRiot, make_history, match_time
from tests.riot_fetch_helpers import status_error
from tests.sync_helpers import (
    FakeStore,
    install_store_stub,
    installed,
    summoner_record,
)

install_store_stub()

from services.summoner.backfill import run_backfill  # noqa: E402


def _run(store: FakeStore, riot: FakeRiot) -> None:
    with installed(store, riot):
        asyncio.run(run_backfill("JP", PUUID))


def _store(history_size: int = 0, saved: int = 0, **record: Any) -> FakeStore:
    """先頭 saved 件が保存済みの FakeStore（カーソルは record で指定）。"""
    times = dict(make_history(history_size))
    preset = {m: times[m] for m in list(times)[:saved]}
    return FakeStore(record=summoner_record(**record), saved=preset)


# ---------------------------------------------------------------------------
# プロパティ: 取得するのは未保存分だけ
# ---------------------------------------------------------------------------


@settings(max_examples=100, deadline=None)
@given(
    flags=st.lists(st.booleans(), max_size=250),
)
def test_only_unsaved_matches_are_fetched(flags: list[bool]) -> None:
    """任意の試合ID列と保存済み集合に対し、詳細を取得するのは未保存分だけ。

    flags[i] が True の試合 i は保存済み。複数ページにまたがる場合も含める。
    """
    history = make_history(len(flags))
    saved = {m: t for (m, t), is_saved in zip(history, flags) if is_saved}
    store = FakeStore(record=summoner_record(), saved=saved)
    riot = FakeRiot(history=history)

    _run(store, riot)

    expected = [m for (m, _), is_saved in zip(history, flags) if not is_saved]
    assert riot.requested_details == expected
    assert store.records[PUUID].backfill_completed is True


# ---------------------------------------------------------------------------
# 開始条件
# ---------------------------------------------------------------------------


def test_does_nothing_when_backfill_cannot_start() -> None:
    """try_start_backfill が False なら Riot API もカーソル更新も行わない。"""
    store = _store(history_size=10)
    store.can_start_backfill = False
    riot = FakeRiot(history=make_history(10))

    _run(store, riot)

    assert riot.calls == []
    assert store.state_updates == [] and store.save_calls == []


# ---------------------------------------------------------------------------
# フェーズB（古い側）
# ---------------------------------------------------------------------------


def test_older_phase_marks_completed_when_less_than_100() -> None:
    """返却が100件未満なら backfill_completed = true、カーソルは最古の試合。"""
    store = _store()
    riot = FakeRiot(history=make_history(30))

    _run(store, riot)

    assert len(store.saved) == 30
    state = store.state_updates[-1]
    assert state.backfill_completed is True
    assert state.backfill_cursor == match_time(29)
    assert riot.id_calls[0]["end_time"] is None


def test_older_phase_cursor_includes_saved_matches() -> None:
    """最古の試合が保存済み（詳細を取得しない）でもカーソルに反映する。"""
    store = _store(history_size=30, saved=30)
    store.saved.pop("JP1_5")
    riot = FakeRiot(history=make_history(30))

    _run(store, riot)

    assert riot.requested_details == ["JP1_5"]
    assert store.state_updates[-1].backfill_cursor == match_time(29)


def test_older_phase_advances_cursor_per_page() -> None:
    """1ページ保存するごとにカーソルを進め、次は endTime = カーソルで取得する。"""
    store = _store(backfill_cursor=match_time(10))
    riot = FakeRiot(history=make_history(260))

    _run(store, riot)

    cursors = [s.backfill_cursor for s in store.state_updates]
    assert cursors == [match_time(109), match_time(208), match_time(259)]
    assert [s.backfill_completed for s in store.state_updates] == [False, False, True]
    assert [c["end_time"] for c in riot.id_calls] == [
        match_time(10),
        match_time(109),
        match_time(208),
    ]
    assert all(c["start"] == 0 and c["count"] == 100 for c in riot.id_calls)


def test_stops_when_cursor_does_not_advance() -> None:
    """カーソルが前回から進まないページが返ったら、無限ループせず終了する。"""
    history = make_history(100)
    store = FakeStore(
        record=summoner_record(backfill_cursor=match_time(99)), saved=dict(history)
    )
    riot = FakeRiot(history=history)
    calls = 0

    async def same_page(*args: Any, **kwargs: Any) -> list[str]:
        nonlocal calls
        calls += 1
        return [m for m, _ in history]

    riot.fetch_ranked_match_ids = same_page  # type: ignore[method-assign]
    _run(store, riot)

    assert calls == 1
    assert store.state_updates == []


# ---------------------------------------------------------------------------
# フェーズA（新しい側）
# ---------------------------------------------------------------------------


def test_newer_phase_fills_gap_and_updates_synced_until() -> None:
    """synced_until 以降の未保存分を取得し、synced_until を最新に更新する。"""
    store = _store(
        history_size=250,
        saved=0,
        synced_until=match_time(150),
        backfill_cursor=match_time(249),
        backfill_completed=True,
    )
    store.saved.update(make_history(250)[150:])
    riot = FakeRiot(history=make_history(250))

    _run(store, riot)

    assert [c["start"] for c in riot.id_calls] == [0, 100]
    assert all(c["start_time"] == match_time(150) for c in riot.id_calls)
    assert riot.requested_details == [f"JP1_{i}" for i in range(150)]
    assert len(store.state_updates) == 1
    state = store.state_updates[0]
    assert state.synced_until == match_time(0)
    assert state.backfill_cursor == match_time(249)
    assert state.backfill_completed is True


def test_newer_phase_is_skipped_without_synced_until() -> None:
    """synced_until が None ならフェーズAを行わない。"""
    store = _store(synced_until=None)
    riot = FakeRiot(history=make_history(5))

    _run(store, riot)

    assert all(c["start_time"] is None for c in riot.id_calls)


# ---------------------------------------------------------------------------
# 429・例外
# ---------------------------------------------------------------------------


def test_rate_limit_stops_and_cursor_stays_at_saved_page() -> None:
    """429 で終了し、カーソルは保存済みページまでしか進まない。取得済みは保存する。"""
    store = _store()
    riot = FakeRiot(history=make_history(250), rate_limit_after=150)

    _run(store, riot)

    assert len(store.saved) == 150
    assert [s.backfill_cursor for s in store.state_updates] == [match_time(99)]
    assert store.state_updates[-1].backfill_completed is False


def test_rerun_after_rate_limit_resumes_from_cursor() -> None:
    """中断後の再実行は、カーソルから続きを取得し、保存済みの試合を再取得しない。"""
    store = _store()
    riot = FakeRiot(history=make_history(250), rate_limit_after=150)
    _run(store, riot)

    resumed = FakeRiot(history=make_history(250))
    _run(store, resumed)

    assert resumed.id_calls[0]["end_time"] == match_time(99)
    assert resumed.requested_details == [f"JP1_{i}" for i in range(150, 250)]
    assert len(store.saved) == 250
    assert store.records[PUUID].backfill_completed is True
    assert store.records[PUUID].backfill_cursor == match_time(249)


@pytest.mark.parametrize(
    "error",
    [RuntimeError("boom"), status_error(500), RiotRateLimitError(status_error(429))],
)
def test_errors_from_match_ids_do_not_escape(error: Exception) -> None:
    """試合ID一覧の取得で例外が起きても、run_backfill は例外を外に出さない。"""
    store = _store()
    riot = FakeRiot(history=make_history(5))
    riot.ids_error = error

    _run(store, riot)

    assert store.state_updates == []


def test_store_error_does_not_escape(caplog: pytest.LogCaptureFixture) -> None:
    """DB 例外も外に出さず、ログに記録する。"""
    store = _store()
    riot = FakeRiot()

    async def broken(*args: Any) -> None:
        raise RuntimeError("db down")

    setattr(store, "find_summoner_by_puuid", broken)
    with caplog.at_level("ERROR"):
        _run(store, riot)

    assert any("Backfill に失敗しました" in r.message for r in caplog.records)
