"""lambda_handlers/crawler.py のテスト: リースの取得・返却、締め切り、接続のクローズ。

_Requirements: 1.8, 3.5, 6.1_
"""

import time
from datetime import timedelta
from types import SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock

import pytest

from adapters.riot_rate_limiter import RiotRateLimiter, get_limiter, set_limiter
from schemas.crawler import CrawlResult
from tests.crawler_helpers import install_crawler_stubs

install_crawler_stubs()

from lambda_handlers import crawler as handler_module  # noqa: E402


def _context(remaining_ms: int = 600_000) -> Any:
    return SimpleNamespace(
        aws_request_id="req-1", get_remaining_time_in_millis=lambda: remaining_ms
    )


@pytest.fixture
def mocks(monkeypatch: pytest.MonkeyPatch) -> SimpleNamespace:
    lease = SimpleNamespace(
        try_acquire=AsyncMock(return_value=True), release=AsyncMock()
    )
    run = AsyncMock(return_value=CrawlResult(stop_reason="completed"))
    close = AsyncMock()
    monkeypatch.setattr(handler_module, "worker_lease_store", lease)
    monkeypatch.setattr(handler_module, "run_crawl", run)
    monkeypatch.setattr(handler_module.riot_api, "close", close)
    return SimpleNamespace(lease=lease, run=run, close=close)


def test_acquires_lease_runs_crawler_with_deadline_and_releases(
    mocks: SimpleNamespace,
) -> None:
    before = time.monotonic()

    result = handler_module.handler({}, _context(600_000))

    assert result == {"status": "done", "stop_reason": "completed"}
    name, holder, ttl = mocks.lease.try_acquire.await_args.args
    assert (name, holder) == ("riot-crawler", "req-1")
    assert ttl == timedelta(seconds=660)  # 残り600秒 + 60秒
    region, deadline, run_id = mocks.run.await_args.args
    assert (region, run_id) == ("JP", "req-1")
    assert before + 599 < deadline < time.monotonic() + 601
    mocks.lease.release.assert_awaited_once_with("riot-crawler", "req-1")
    mocks.close.assert_awaited_once()


def test_does_nothing_when_lease_is_unavailable(mocks: SimpleNamespace) -> None:
    mocks.lease.try_acquire.return_value = False

    result = handler_module.handler({}, _context())

    assert result == {"status": "lease_unavailable"}
    mocks.run.assert_not_awaited()
    mocks.lease.release.assert_not_awaited()
    mocks.close.assert_awaited_once()


def test_releases_lease_and_closes_when_crawler_raises(mocks: SimpleNamespace) -> None:
    mocks.run.side_effect = RuntimeError("boom")

    with pytest.raises(RuntimeError):
        handler_module.handler({}, _context())

    mocks.lease.release.assert_awaited_once_with("riot-crawler", "req-1")
    mocks.close.assert_awaited_once()


def test_release_failure_does_not_fail_the_invocation(mocks: SimpleNamespace) -> None:
    mocks.lease.release.side_effect = RuntimeError("db down")

    assert handler_module.handler({}, _context())["status"] == "done"


def test_rate_limiter_is_kept_across_invocations(mocks: SimpleNamespace) -> None:
    """送信時刻のカウントを残すため、起動ごとに共有のレート制限を作り直さない。"""
    limiter = RiotRateLimiter([(100, 1.0)], max_wait=0, backfill_reserve_ratio=0)
    set_limiter(limiter)
    try:
        handler_module.handler({}, _context())
        handler_module.handler({}, _context())

        assert get_limiter() is limiter
    finally:
        set_limiter(None)
