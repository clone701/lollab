"""backfill.py の取りこぼし防止のテスト（Summoner_Store と Riot API 取得はモック）。

通過済み = 保存済み、または failed_matches で gave_up = true。

_Requirements: 3.7, 3.8, 9.4_
"""

import asyncio
from typing import Any

from tests.fake_riot import PUUID, FakeRiot, make_history, match_time
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


def _store(**record: Any) -> FakeStore:
    return FakeStore(record=summoner_record(**record))


# ---------------------------------------------------------------------------
# フェーズB（古い側）
# ---------------------------------------------------------------------------


def test_failure_stops_cursor_just_before_failed_match() -> None:
    """失敗した試合があると、カーソルはその手前（直前の通過済みの試合）で止まる。"""
    store = _store()
    riot = FakeRiot(history=make_history(30), fail_ids={"JP1_10"})

    _run(store, riot)

    assert len(store.saved) == 29 and "JP1_10" not in store.saved
    state = store.state_updates[-1]
    assert state.backfill_cursor == match_time(9)
    assert state.backfill_completed is False
    assert store.failed == {"JP1_10": (1, "HTTP 500", False)}


def test_rerun_refetches_only_the_failed_match_and_clears_record() -> None:
    """再実行では失敗した試合だけ取り直し、成功したら failed_matches から消える。"""
    store = _store()
    _run(store, FakeRiot(history=make_history(30), fail_ids={"JP1_10"}))

    resumed = FakeRiot(history=make_history(30))
    _run(store, resumed)

    assert resumed.requested_details == ["JP1_10"]
    assert resumed.id_calls[0]["end_time"] == match_time(9)
    assert store.failed == {}
    state = store.records[PUUID]
    assert state.backfill_completed is True
    assert state.backfill_cursor == match_time(29)


def test_third_failure_gives_up_and_moves_on() -> None:
    """3回失敗した試合は取得不能になり、それより古い試合へ進む。"""
    store = _store()
    for _ in range(3):
        _run(store, FakeRiot(history=make_history(30), fail_ids={"JP1_10"}))
        assert store.records[PUUID].backfill_completed is (store.failed["JP1_10"][2])

    assert store.failed["JP1_10"] == (3, "HTTP 500", True)
    assert store.records[PUUID].backfill_completed is True
    assert store.records[PUUID].backfill_cursor == match_time(29)


def test_gave_up_match_is_not_fetched_again() -> None:
    """取得不能と判定済みの試合は取得せず、通過済みとして先へ進む。"""
    store = _store()
    store.failed["JP1_10"] = (3, "HTTP 404", True)
    riot = FakeRiot(history=make_history(30))

    _run(store, riot)

    assert "JP1_10" not in riot.requested_details
    assert len(store.saved) == 29
    assert store.records[PUUID].backfill_completed is True
    assert store.failed["JP1_10"] == (3, "HTTP 404", True)


def test_failure_on_last_page_does_not_complete() -> None:
    """最後のページ（100件未満）に失敗があると、backfill_completed にならない。"""
    store = _store()
    riot = FakeRiot(history=make_history(30), fail_ids={"JP1_29"})

    _run(store, riot)

    state = store.records[PUUID]
    assert state.backfill_completed is False
    assert state.backfill_cursor == match_time(28)


def test_failure_at_page_start_does_not_move_cursor() -> None:
    """ページの先頭が失敗した場合、カーソルは動かない。"""
    store = _store(backfill_cursor=match_time(5))
    store.saved["JP1_5"] = match_time(5)
    riot = FakeRiot(history=make_history(30), fail_ids={"JP1_6"})

    _run(store, riot)

    assert store.state_updates == []
    assert store.records[PUUID].backfill_cursor == match_time(5)


def test_rate_limit_still_records_failures_of_the_batch() -> None:
    """429 で中断しても、同じバッチで失敗した試合は記録する。"""
    store = _store()
    riot = FakeRiot(history=make_history(30), rate_limit_after=3, fail_ids={"JP1_1"})

    _run(store, riot)

    assert store.failed == {"JP1_1": (1, "HTTP 500", False)}
    assert store.state_updates == []


# ---------------------------------------------------------------------------
# フェーズA（新しい側）
# ---------------------------------------------------------------------------


def test_newer_phase_keeps_synced_until_when_a_match_fails() -> None:
    """失敗した試合が残るページでは synced_until を進めず、次回は失敗分だけ取り直す。"""
    store = _store(synced_until=match_time(20), backfill_completed=True)
    store.saved.update(make_history(30)[20:])
    _run(store, FakeRiot(history=make_history(30), fail_ids={"JP1_5"}))

    assert store.state_updates == []
    assert store.records[PUUID].synced_until == match_time(20)

    resumed = FakeRiot(history=make_history(30))
    _run(store, resumed)

    assert resumed.requested_details == ["JP1_5"]
    assert store.records[PUUID].synced_until == match_time(0)
    assert store.failed == {}


def test_newer_phase_failure_ends_backfill_before_older_phase() -> None:
    """フェーズAで通過済みでない試合が残ったら、Backfill 全体を終了する。"""
    store = _store(synced_until=match_time(20), backfill_cursor=match_time(25))
    riot = FakeRiot(history=make_history(30), fail_ids={"JP1_5"})

    _run(store, riot)

    assert len(riot.id_calls) == 1
    assert riot.id_calls[0]["start_time"] == match_time(20)
    assert store.records[PUUID].backfill_cursor == match_time(25)


# ---------------------------------------------------------------------------
# レート制限の優先度
# ---------------------------------------------------------------------------


def test_backfill_requests_use_backfill_priority() -> None:
    """Backfill の試合ID一覧・試合詳細は priority="backfill" で取得する。"""
    store = _store(synced_until=match_time(40))
    riot = FakeRiot(history=make_history(30))

    _run(store, riot)

    assert {c["priority"] for c in riot.id_calls} == {"backfill"}
    assert set(riot.detail_priorities) == {"backfill"}
