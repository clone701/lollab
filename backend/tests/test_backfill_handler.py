"""lambda_handlers/backfill.py のテスト: リースの取得・解放と締め切りの算出。

_Requirements: 2.3, 2.5, 3.2_
"""

import sys
import time
from datetime import timedelta
from types import ModuleType, SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock

import pytest

from tests.sync_helpers import install_store_stub

install_store_stub()

# 本物の worker_lease_store は import 時に Supabase クライアントを作るため、代役にする
_lease_stub = ModuleType("adapters.worker_lease_store")
_lease_stub.try_acquire = AsyncMock()  # type: ignore[attr-defined]
_lease_stub.release = AsyncMock()  # type: ignore[attr-defined]
sys.modules.setdefault("adapters.worker_lease_store", _lease_stub)

from lambda_handlers import backfill as handler_module  # noqa: E402

EVENT = {"region": "JP", "puuid": "puuid-0"}


def _context(remaining_ms: int = 300_000) -> Any:
    return SimpleNamespace(
        aws_request_id="req-1", get_remaining_time_in_millis=lambda: remaining_ms
    )


@pytest.fixture
def mocks(monkeypatch: pytest.MonkeyPatch) -> SimpleNamespace:
    lease = SimpleNamespace(
        try_acquire=AsyncMock(return_value=True), release=AsyncMock()
    )
    run = AsyncMock()
    close = AsyncMock()
    monkeypatch.setattr(handler_module, "worker_lease_store", lease)
    monkeypatch.setattr(handler_module, "run_backfill", run)
    monkeypatch.setattr(handler_module.riot_api, "close", close)
    return SimpleNamespace(lease=lease, run=run, close=close)


def test_acquires_lease_runs_backfill_with_deadline_and_releases(
    mocks: SimpleNamespace,
) -> None:
    before = time.monotonic()

    result = handler_module.handler(EVENT, _context(300_000))

    assert result == {"status": "done"}
    name, holder, ttl = mocks.lease.try_acquire.await_args.args
    assert (name, holder) == ("riot-backfill", "req-1")
    assert ttl == timedelta(seconds=360)  # 残り300秒 + 60秒
    region, puuid, deadline = mocks.run.await_args.args
    assert (region, puuid) == ("JP", "puuid-0")
    assert before + 299 < deadline < time.monotonic() + 301
    mocks.lease.release.assert_awaited_once_with("riot-backfill", "req-1")
    mocks.close.assert_awaited_once()


def test_does_nothing_when_lease_is_unavailable(mocks: SimpleNamespace) -> None:
    mocks.lease.try_acquire.return_value = False

    result = handler_module.handler(EVENT, _context())

    assert result == {"status": "lease_unavailable"}
    mocks.run.assert_not_awaited()
    mocks.lease.release.assert_not_awaited()


def test_releases_lease_when_backfill_raises(mocks: SimpleNamespace) -> None:
    mocks.run.side_effect = RuntimeError("boom")

    with pytest.raises(RuntimeError):
        handler_module.handler(EVENT, _context())

    mocks.lease.release.assert_awaited_once_with("riot-backfill", "req-1")
    mocks.close.assert_awaited_once()


def test_release_failure_does_not_fail_the_invocation(mocks: SimpleNamespace) -> None:
    mocks.lease.release.side_effect = RuntimeError("db down")

    assert handler_module.handler(EVENT, _context()) == {"status": "done"}


@pytest.mark.parametrize(
    "event", [{}, {"region": "JP"}, {"puuid": "p"}, {"region": 1, "puuid": "p"}]
)
def test_invalid_event_is_ignored(
    mocks: SimpleNamespace, event: dict[str, Any]
) -> None:
    result = handler_module.handler(event, _context())

    assert result == {"status": "invalid_event"}
    mocks.lease.try_acquire.assert_not_awaited()
    mocks.run.assert_not_awaited()
