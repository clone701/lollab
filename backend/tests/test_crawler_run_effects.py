"""services/crawler/run.py のテスト: バンドルの書き込み・prune・ログ。

_Requirements: 4.1, 4.2, 6.1, 6.3_
"""

import gzip
import json
import logging
from unittest.mock import AsyncMock

import pytest

from adapters.riot_rate_limiter import RiotRateLimiter
from tests.crawler_helpers import CrawlerFakeStore
from tests.crawler_run_helpers import (  # noqa: F401
    CountingRiot,
    limiter_fixture,
    pruned_fixture,
    put_gzip_fixture,
    run_once,
    seeds_of,
)
from tests.fake_riot import make_history


def test_bundle_is_written_once_with_raw_data_of_saved_matches(
    monkeypatch: pytest.MonkeyPatch,
    limiter: RiotRateLimiter,
    put_gzip: AsyncMock,
    pruned: AsyncMock,
) -> None:
    run_once(monkeypatch, seeds_of(2), CountingRiot(limiter, make_history(2)))

    put_gzip.assert_awaited_once()
    key, data = put_gzip.await_args_list[0].args
    assert key.startswith("bundles/crawler/") and key.endswith("/run-1.jsonl.gz")
    lines = [json.loads(line) for line in gzip.decompress(data).splitlines()]
    assert {(entry["match_id"], entry["kind"]) for entry in lines} == {
        ("JP1_0", "detail"),
        ("JP1_0", "timeline"),
        ("JP1_1", "detail"),
        ("JP1_1", "timeline"),
    }


def test_bundle_write_failure_is_only_logged(
    monkeypatch: pytest.MonkeyPatch,
    limiter: RiotRateLimiter,
    put_gzip: AsyncMock,
    pruned: AsyncMock,
    caplog: pytest.LogCaptureFixture,
) -> None:
    put_gzip.side_effect = RuntimeError("s3 down")
    store = CrawlerFakeStore()

    result = run_once(
        monkeypatch, seeds_of(1), CountingRiot(limiter, make_history(1)), store
    )

    assert result.stop_reason == "completed" and result.matches_saved == 1
    assert len(store.saved_matches) == 1
    assert any("バンドルの書き込みに失敗" in r.getMessage() for r in caplog.records)
    pruned.assert_awaited_once()


def test_prune_failure_is_only_logged(
    monkeypatch: pytest.MonkeyPatch,
    limiter: RiotRateLimiter,
    put_gzip: AsyncMock,
    pruned: AsyncMock,
    caplog: pytest.LogCaptureFixture,
) -> None:
    pruned.side_effect = RuntimeError("db down")

    result = run_once(monkeypatch, seeds_of(1), CountingRiot(limiter, make_history(1)))

    assert result.matches_pruned == 0 and result.stop_reason == "completed"
    assert any("削除に失敗" in r.getMessage() for r in caplog.records)


def test_unexpected_error_still_writes_bundle(
    monkeypatch: pytest.MonkeyPatch,
    limiter: RiotRateLimiter,
    put_gzip: AsyncMock,
    pruned: AsyncMock,
) -> None:
    """予期しない例外は伝えるが、保存済みの試合の生データは書き込む。"""
    seed_store = seeds_of(1)
    setattr(seed_store, "mark_crawled", AsyncMock(side_effect=RuntimeError("db")))

    with pytest.raises(RuntimeError):
        run_once(monkeypatch, seed_store, CountingRiot(limiter, make_history(1)))

    put_gzip.assert_awaited_once()


def test_result_is_logged_as_one_json_line_without_puuid(
    monkeypatch: pytest.MonkeyPatch,
    limiter: RiotRateLimiter,
    put_gzip: AsyncMock,
    pruned: AsyncMock,
    caplog: pytest.LogCaptureFixture,
) -> None:
    caplog.set_level(logging.INFO)

    result = run_once(monkeypatch, seeds_of(2), CountingRiot(limiter, make_history(2)))

    logged = [
        r.getMessage()
        for r in caplog.records
        if r.name == "services.crawler.run" and r.getMessage().startswith("{")
    ]
    assert len(logged) == 1
    assert json.loads(logged[0]) == result.model_dump()
    assert "\n" not in logged[0]
    assert not any("seed-" in r.getMessage() for r in caplog.records)
