"""run_crawl のテスト用ヘルパー: 代役のフィクスチャと実行関数。

フィクスチャは使う側のテストファイルで import する（noqa: F401）。
"""

import asyncio
from collections.abc import Iterator
from datetime import datetime, timezone
from typing import Any
from unittest.mock import AsyncMock

import pytest

from adapters import raw_store
from adapters.riot_rate_limiter import RiotRateLimiter, set_limiter
from schemas.crawler import CrawlResult
from tests.crawler_helpers import (
    CrawlerFakeStore,
    FakeSeedStore,
    install_crawler_stubs,
    install_seed_store,
    make_seed,
)
from tests.fake_riot import FakeRiot
from tests.sync_helpers import installed

install_crawler_stubs()

from services.crawler import prune, run  # noqa: E402

OLD = datetime(2025, 1, 1, tzinfo=timezone.utc)


class CountingRiot(FakeRiot):
    """試合ID一覧の取得ごとにレート制限の送信数を1足す代役。"""

    def __init__(self, limiter: RiotRateLimiter, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.limiter = limiter

    async def fetch_ranked_match_ids(self, *args: Any, **kwargs: Any) -> list[str]:
        self.limiter.total_sent += 1
        return await super().fetch_ranked_match_ids(*args, **kwargs)


@pytest.fixture(name="limiter")
def limiter_fixture() -> Iterator[RiotRateLimiter]:
    limiter = RiotRateLimiter([(100, 1.0)], max_wait=0, backfill_reserve_ratio=0)
    limiter.total_sent = 5  # 前の起動までの累計
    set_limiter(limiter)
    yield limiter
    set_limiter(None)


@pytest.fixture(name="put_gzip")
def put_gzip_fixture(monkeypatch: pytest.MonkeyPatch) -> AsyncMock:
    mock = AsyncMock()
    monkeypatch.setattr(raw_store, "put_gzip", mock)
    return mock


@pytest.fixture(name="pruned")
def pruned_fixture(monkeypatch: pytest.MonkeyPatch) -> AsyncMock:
    mock = AsyncMock(return_value=5)
    monkeypatch.setattr(prune.crawler_match_store, "prune_crawler_matches", mock)
    return mock


def seeds_of(count: int) -> FakeSeedStore:
    return FakeSeedStore(
        # FakeRiot の履歴（2025-03-01 以前）が startTime に入るよう、古い日時にする
        [make_seed(f"seed-{i}", "DIAMOND", OLD) for i in range(count)],
        last_refreshed_at=None,
    )


def run_once(
    monkeypatch: pytest.MonkeyPatch,
    seed_store: FakeSeedStore,
    riot: FakeRiot,
    store: CrawlerFakeStore | None = None,
    deadline: float | None = None,
) -> CrawlResult:
    """収集元の更新を除いた run_crawl を1回動かす（更新は seeds のテストで確認済み）。"""
    install_seed_store(monkeypatch, seed_store)
    monkeypatch.setattr(run.seeds, "refresh_seeds_if_stale", AsyncMock())
    with installed(store or CrawlerFakeStore(), riot):
        return asyncio.run(run.run_crawl("JP", deadline, "run-1"))
