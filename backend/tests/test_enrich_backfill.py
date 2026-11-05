"""Backfill と補完フェーズの接続のテスト、更新時の Backfill 開始条件。

_Requirements: 3.4, 4.7_
"""

import asyncio
from datetime import datetime, timezone
from typing import Any

import pytest

from tests.fake_riot import PUUID, FakeRiot, make_history, match_time
from tests.sync_helpers import (
    FakeStore,
    install_store_stub,
    installed,
    summoner_record,
)

install_store_stub()

from services.summoner.backfill import run_backfill  # noqa: E402
from services.summoner.update import update_summoner  # noqa: E402

_TARGET_ID = "JP1_900"
_TARGET_TIME = datetime(2024, 1, 1, tzinfo=timezone.utc)


def _store(history_size: int = 0, saved: int = 0, **record: object) -> FakeStore:
    times = dict(make_history(history_size))
    preset = {m: times[m] for m in list(times)[:saved]}
    store = FakeStore(record=summoner_record(**record), saved=preset)
    store.add_target(_TARGET_ID, _TARGET_TIME)
    return store


def _riot(history_size: int = 0, **options: Any) -> FakeRiot:
    history = make_history(history_size)
    extra = {_TARGET_ID: _TARGET_TIME}
    return FakeRiot(history=history, extra_times=extra, **options)


def _run(store: FakeStore, riot: FakeRiot) -> None:
    with installed(store, riot):
        asyncio.run(run_backfill("JP", PUUID))


def test_enrichment_runs_after_older_phase_completes() -> None:
    """フェーズ2が履歴の最後まで終わったら、補完を行う（予約枠付きの backfill 優先度）。"""
    store = _store(history_size=3)
    riot = _riot(history_size=3)

    _run(store, riot)

    assert store.records[PUUID].backfill_completed is True
    assert store.targets == {}
    assert riot.requested_details[-1] == _TARGET_ID
    assert riot.detail_priorities[-1] == "backfill"


def test_enrichment_runs_when_backfill_already_completed() -> None:
    """Backfill が完了済みでも、補完対象が残っていれば補完する。"""
    store = _store(backfill_completed=True)
    riot = _riot()

    _run(store, riot)

    assert store.targets == {}
    assert riot.requested_details == [_TARGET_ID]
    assert riot.id_calls == []  # 試合ID一覧は取得しない


def test_enrichment_skipped_when_newer_phase_has_unresolved_matches() -> None:
    """フェーズ1で取得に失敗した試合が残ったら、補完まで進まない。"""
    store = _store(history_size=3, synced_until=match_time(5))
    riot = _riot(history_size=3, fail_ids={"JP1_1"})

    _run(store, riot)

    assert _TARGET_ID not in riot.requested_details
    assert _TARGET_ID in store.targets


def test_enrichment_skipped_when_older_phase_has_unresolved_matches() -> None:
    """フェーズ2で取得に失敗した試合が残ったら、補完まで進まない。"""
    store = _store(history_size=3)
    riot = _riot(history_size=3, fail_ids={"JP1_1"})

    _run(store, riot)

    assert store.records[PUUID].backfill_completed is False
    assert _TARGET_ID not in riot.requested_details


def test_rate_limit_during_enrichment_ends_quietly_and_keeps_cursors() -> None:
    """補完中のレート制限は外に出さず終了する。フェーズ2の結果（完了）は保持される。"""
    store = _store(history_size=2)
    riot = _riot(history_size=2, rate_limit_after=2)

    _run(store, riot)

    assert store.records[PUUID].backfill_completed is True
    assert _TARGET_ID in store.targets


def test_does_not_enrich_when_backfill_cannot_start() -> None:
    store = _store(backfill_completed=True)
    store.can_start_backfill = False
    riot = _riot()

    _run(store, riot)

    assert riot.calls == []


# ---------------------------------------------------------------------------
# 更新時の Backfill 開始条件（勝敗数の合計が同じ場合）
# ---------------------------------------------------------------------------


def _same_total_store(**overrides: object) -> FakeStore:
    fields: dict[str, object] = {
        "solo_wins": 20,
        "solo_losses": 10,
        "flex_wins": 3,
        "flex_losses": 2,
        "backfill_completed": True,
    }
    fields.update(overrides)
    return FakeStore(record=summoner_record(**fields))


def _update(store: FakeStore) -> str | None:
    with installed(store, FakeRiot()):
        _, puuid = asyncio.run(update_summoner("JP", "TestUser", "JP1"))
    return puuid


def test_update_starts_backfill_when_enrichment_targets_remain() -> None:
    """合計が同じで Backfill が完了済みでも、補完対象があれば Backfill を開始する。"""
    store = _same_total_store()
    store.add_target(_TARGET_ID, _TARGET_TIME)

    assert _update(store) == PUUID


def test_update_does_not_start_backfill_without_targets() -> None:
    assert _update(_same_total_store()) is None


def test_update_ignores_gave_up_targets() -> None:
    """取得不能と判定済みの試合しか残っていなければ、Backfill を開始しない。"""
    store = _same_total_store()
    store.add_target(_TARGET_ID, _TARGET_TIME)
    store.failed[_TARGET_ID] = (3, "HTTP 404", True)

    assert _update(store) is None


def test_update_does_not_fail_when_target_check_fails(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """補完対象の確認に失敗しても、更新は成功させる（Backfill は開始しない）。"""
    store = _same_total_store()

    async def _broken(after: object, limit: int) -> list[object]:
        raise RuntimeError("db down")

    monkeypatch.setattr(store, "get_enrichment_targets", _broken)

    assert _update(store) is None
