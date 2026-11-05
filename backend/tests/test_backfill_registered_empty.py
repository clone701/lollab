"""試合0件で登録したサモナー（synced_until あり・completed=true・cursor なし）の Backfill。"""

import asyncio

from tests.fake_riot import PUUID, FakeRiot, make_history, match_time
from tests.sync_helpers import (
    FakeStore,
    install_store_stub,
    installed,
    summoner_record,
)

install_store_stub()

from services.summoner.backfill import run_backfill  # noqa: E402


def test_newer_phase_runs_and_older_phase_is_skipped() -> None:
    """フェーズAで startTime = synced_until の取得を行い、フェーズBは行わない。"""
    registered_at = match_time(40)
    record = summoner_record(synced_until=registered_at, backfill_completed=True)
    store = FakeStore(record=record)
    riot = FakeRiot(history=make_history(30))

    with installed(store, riot):
        asyncio.run(run_backfill("JP", PUUID))

    assert len(riot.id_calls) == 1
    assert riot.id_calls[0]["start_time"] == registered_at
    assert riot.id_calls[0]["end_time"] is None
    assert riot.requested_details == [f"JP1_{i}" for i in range(30)]
    assert store.state_updates[-1].synced_until == match_time(0)
    assert store.state_updates[-1].backfill_completed is True
