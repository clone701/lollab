"""タイムライン取得に失敗した試合の扱い（同期部分・Backfill）のテスト。

_Requirements: 4.6, 4.7_
"""

import asyncio

from tests.fake_riot import PUUID, FakeRiot, make_history
from tests.sync_helpers import (
    FakeStore,
    install_store_stub,
    installed,
    summoner_record,
)

install_store_stub()

from services.summoner.backfill import run_backfill  # noqa: E402
from services.summoner.search import search_summoner  # noqa: E402


def test_sync_saves_match_without_timeline_and_continues_with_others() -> None:
    """同期部分では、タイムライン失敗の試合も詳細を保存し、他の試合の処理を続ける。

    失敗は記録しない（回数を数えるのは Backfill と補完）。
    """
    store = FakeStore()
    riot = FakeRiot(history=make_history(3), timeline_fail_ids={"JP1_1"})

    with installed(store, riot):
        asyncio.run(search_summoner("JP", "TestUser", "JP1"))

    saved = {m.match_id: m for m in store.saved_matches}
    assert set(saved) == {"JP1_0", "JP1_1", "JP1_2"}
    assert saved["JP1_1"].timeline_fetched_at is None
    assert saved["JP1_0"].timeline_fetched_at is not None
    assert saved["JP1_2"].timeline_fetched_at is not None
    assert store.failed == {}


def test_backfill_counts_timeline_failure_but_advances_cursor() -> None:
    """Backfill: タイムラインだけ失敗した試合は保存済み（通過済み）としてカーソルを進め、回数を数える。"""
    store = FakeStore(record=summoner_record())
    riot = FakeRiot(history=make_history(3), timeline_fail_ids={"JP1_1"})

    with installed(store, riot):
        asyncio.run(run_backfill("JP", PUUID))

    assert store.records[PUUID].backfill_completed is True
    assert store.failed["JP1_1"] == (1, "HTTP 500", False)
    assert "JP1_0" not in store.failed and "JP1_2" not in store.failed


def test_backfill_passes_bans_to_save() -> None:
    """保存時に BAN も渡す（FakeRiot の試合は BAN なしのため、空であること）。"""
    store = FakeStore(record=summoner_record())

    with installed(store, FakeRiot(history=make_history(1))):
        asyncio.run(run_backfill("JP", PUUID))

    assert store.saved_bans == []
    assert [m.match_id for m in store.saved_matches] == ["JP1_0"]
