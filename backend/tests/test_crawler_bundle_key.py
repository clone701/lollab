"""クローラーが、保存する試合に生データのまとめファイルのキーを書くことのテスト。

_Requirements: match-detail 1.1
"""

import asyncio
from typing import Any
from unittest.mock import AsyncMock

import pytest

from tests.crawler_helpers import (
    CrawlerFakeStore,
    FakeSeedStore,
    install_crawler_stubs,
    install_seed_store,
    make_seed,
)
from tests.crawler_run_helpers import (  # noqa: F401
    OLD,
    limiter_fixture,
    pruned_fixture,
    put_gzip_fixture,
    run_once,
    seeds_of,
)
from tests.fake_riot import FakeRiot, make_history
from tests.sync_helpers import installed

install_crawler_stubs()

from services.crawler import collect  # noqa: E402

KEY = "bundles/crawler/2026-11-06/run-1.jsonl.gz"


class Archive:
    async def save_detail(self, match_id: str, payload: dict[str, Any]) -> None:
        pass

    async def save_timeline(self, match_id: str, payload: dict[str, Any]) -> None:
        pass


def _collect(
    monkeypatch: pytest.MonkeyPatch,
    store: CrawlerFakeStore,
    riot: FakeRiot,
    **kwargs: Any,
) -> None:
    install_seed_store(monkeypatch, FakeSeedStore())
    # FakeRiot の履歴（2025-03-01 以前）が startTime に入るよう、古い日時にする
    seed = make_seed("seed-0", "DIAMOND", OLD)
    with installed(store, riot):
        asyncio.run(collect.collect_seed("JP", seed, Archive(), **kwargs))


def test_collect_writes_bundle_key_to_saved_matches(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    store = CrawlerFakeStore()

    _collect(monkeypatch, store, FakeRiot(make_history(2)), bundle_key=KEY)

    assert [m.raw_bundle_key for m in store.saved_matches] == [KEY, KEY]
    assert {m.rank_tier for m in store.saved_matches} == {"DIAMOND"}


def test_collect_without_bundle_key_leaves_it_none(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    store = CrawlerFakeStore()

    _collect(monkeypatch, store, FakeRiot(make_history(2)))

    assert [m.raw_bundle_key for m in store.saved_matches] == [None, None]


def test_collect_writes_bundle_key_to_matches_saved_before_rate_limit(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from services.summoner.riot_errors import RiotRateLimitError

    store = CrawlerFakeStore()
    riot = FakeRiot(make_history(3), rate_limit_after=1)

    with pytest.raises(RiotRateLimitError):
        _collect(monkeypatch, store, riot, bundle_key=KEY)

    assert [m.raw_bundle_key for m in store.saved_matches] == [KEY]


def test_run_passes_the_bundle_file_key_to_saved_matches(
    monkeypatch: pytest.MonkeyPatch,
    limiter: Any,
    put_gzip: AsyncMock,
    pruned: AsyncMock,
) -> None:
    """起動のまとめファイルのキー（flush で書き込む先）が、保存した試合のキーになる。"""
    store = CrawlerFakeStore()

    run_once(monkeypatch, seeds_of(2), FakeRiot(make_history(3)), store)

    keys = {m.raw_bundle_key for m in store.saved_matches}
    assert len(store.saved_matches) == 3 and len(keys) == 1
    [key] = keys
    assert key is not None
    assert key.startswith("bundles/crawler/") and key.endswith("/run-1.jsonl.gz")
    # まとめファイルの書き込み先と同じキー
    put_gzip.assert_awaited_once()
    assert put_gzip.await_args is not None
    assert put_gzip.await_args.args[0] == key
