"""services/crawler/run.py のテスト: 終了理由と CrawlResult の値。

_Requirements: 1.1〜1.5, 3.3〜3.5, 6.1_
"""

import time
from unittest.mock import AsyncMock

import pytest

from adapters.riot_rate_limiter import RiotRateLimiter
from schemas.crawler import CrawlResult
from tests.crawler_helpers import CrawlerFakeStore
from tests.crawler_run_helpers import (  # noqa: F401
    CountingRiot,
    limiter_fixture,
    pruned_fixture,
    put_gzip_fixture,
    run_once,
    seeds_of,
)
from tests.fake_riot import FakeRiot, make_history
from tests.riot_fetch_helpers import status_error

from services.crawler import run  # noqa: E402  isort: skip


def test_completed_run_collects_every_seed_and_prunes(
    monkeypatch: pytest.MonkeyPatch,
    limiter: RiotRateLimiter,
    put_gzip: AsyncMock,
    pruned: AsyncMock,
) -> None:
    riot = CountingRiot(limiter, make_history(2))

    result = run_once(monkeypatch, seeds_of(3), riot)

    assert result == CrawlResult(
        stop_reason="completed",
        seeds_crawled=3,
        matches_saved=2,  # 2人目以降は保存済みで取り直さない
        matches_failed=0,
        matches_pruned=5,
        riot_requests=3,
    )
    pruned.assert_awaited_once_with(40_000, 2_000)


def test_no_seeds_ends_without_bundle_but_still_prunes(
    monkeypatch: pytest.MonkeyPatch,
    limiter: RiotRateLimiter,
    put_gzip: AsyncMock,
    pruned: AsyncMock,
) -> None:
    result = run_once(monkeypatch, seeds_of(0), FakeRiot())

    assert result.stop_reason == "no_seeds"
    assert result.seeds_crawled == 0
    put_gzip.assert_not_awaited()
    pruned.assert_awaited_once()


def test_deadline_stops_before_next_seed_with_150_second_margin(
    monkeypatch: pytest.MonkeyPatch,
    limiter: RiotRateLimiter,
    put_gzip: AsyncMock,
    pruned: AsyncMock,
) -> None:
    answers = iter([False, True])
    margins: list[float] = []

    def is_near(deadline: float | None, margin: float) -> bool:
        margins.append(margin)
        return next(answers)

    monkeypatch.setattr(run.deadline_check, "is_near", is_near)

    result = run_once(
        monkeypatch, seeds_of(3), CountingRiot(limiter, make_history(1)), deadline=1.0
    )

    assert result.stop_reason == "deadline"
    assert result.seeds_crawled == 1
    assert margins == [150.0, 150.0]
    pruned.assert_awaited_once()


def test_already_near_deadline_crawls_nothing(
    monkeypatch: pytest.MonkeyPatch,
    limiter: RiotRateLimiter,
    put_gzip: AsyncMock,
    pruned: AsyncMock,
) -> None:
    riot = CountingRiot(limiter, make_history(1))

    result = run_once(monkeypatch, seeds_of(3), riot, deadline=time.monotonic() + 100)

    assert result.stop_reason == "deadline" and result.seeds_crawled == 0
    assert riot.calls == []


def test_rate_limit_keeps_saved_matches_and_stops(
    monkeypatch: pytest.MonkeyPatch,
    limiter: RiotRateLimiter,
    put_gzip: AsyncMock,
    pruned: AsyncMock,
) -> None:
    store = CrawlerFakeStore()
    riot = FakeRiot(make_history(3), rate_limit_after=1)

    result = run_once(monkeypatch, seeds_of(3), riot, store)

    assert result.stop_reason == "rate_limited"
    assert result.matches_saved == 1 and result.seeds_crawled == 0
    assert [m.match_id for m in store.saved_matches] == ["JP1_0"]
    put_gzip.assert_awaited_once()
    pruned.assert_awaited_once()
    assert riot.calls.count("match_ids") == 1  # 次の収集元に進まない


def test_ten_failed_matches_end_the_run(
    monkeypatch: pytest.MonkeyPatch,
    limiter: RiotRateLimiter,
    put_gzip: AsyncMock,
    pruned: AsyncMock,
) -> None:
    history = make_history(12)
    riot = FakeRiot(history, fail_ids={m for m, _ in history})

    result = run_once(monkeypatch, seeds_of(3), riot)

    assert result.stop_reason == "too_many_failures"
    assert result.matches_failed == 12 and result.seeds_crawled == 0
    assert riot.calls.count("match_ids") == 1


def test_failures_accumulate_across_seeds(
    monkeypatch: pytest.MonkeyPatch,
    limiter: RiotRateLimiter,
    put_gzip: AsyncMock,
    pruned: AsyncMock,
) -> None:
    """失敗は収集元をまたいで累計し、10件に達した時点で終える（試合ID一覧の失敗も1件）。"""
    riot = FakeRiot(make_history(3))
    riot.ids_error = status_error(500)

    result = run_once(monkeypatch, seeds_of(12), riot)

    assert result.stop_reason == "too_many_failures"
    assert riot.calls.count("match_ids") == 10
    assert result.seeds_crawled == 0
