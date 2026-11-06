"""adapters/crawler_seed_store.py のユニットテスト（Supabase クライアントは代役）。

_Requirements: 1.3, 1.6_
"""

import asyncio
from datetime import datetime, timezone
from types import SimpleNamespace
from typing import Any

import pytest
from postgrest.types import CountMethod, ReturnMethod

from schemas.crawler import CrawlerSeed
from tests.store_helpers import FakeClient, FakeQuery, load_store

seed_store = load_store("crawler_seed_store.py")

T = datetime(2026, 11, 6, 12, 0, tzinfo=timezone.utc)


def _use(monkeypatch: pytest.MonkeyPatch, client: Any) -> None:
    monkeypatch.setattr(seed_store, "supabase", client)


def _seed(puuid: str) -> CrawlerSeed:
    return CrawlerSeed(
        puuid=puuid,
        tier="DIAMOND",
        division="II",
        league_points=10,
        refreshed_at=T,
        last_crawled_at=T,
    )


def test_get_last_refreshed_at(monkeypatch: pytest.MonkeyPatch) -> None:
    client = FakeClient([{"refreshed_at": "2026-11-06T12:00:00+00:00"}], [])
    _use(monkeypatch, client)

    assert asyncio.run(seed_store.get_last_refreshed_at()) == T
    assert asyncio.run(seed_store.get_last_refreshed_at()) is None
    query = client.queries[0][1]
    assert query.call("order") == (("refreshed_at",), {"desc": True})


def test_upsert_adds_region_and_never_writes_last_crawled_at(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = FakeClient()
    _use(monkeypatch, client)

    asyncio.run(seed_store.upsert_seeds([_seed("a"), _seed("b")], "JP"))

    args, kwargs = client.queries[0][1].call("upsert")
    assert [r["puuid"] for r in args[0]] == ["a", "b"]
    assert all(r["region"] == "JP" for r in args[0])
    assert all("last_crawled_at" not in r for r in args[0])
    assert kwargs["on_conflict"] == "puuid"
    assert kwargs["returning"] == ReturnMethod.minimal


def test_upsert_splits_large_batches(monkeypatch: pytest.MonkeyPatch) -> None:
    client = FakeClient()
    _use(monkeypatch, client)

    asyncio.run(seed_store.upsert_seeds([_seed(f"p{i}") for i in range(1200)], "JP"))

    sizes = [len(q.call("upsert")[0][0]) for _, q in client.queries]
    assert sizes == [500, 500, 200]


def test_upsert_empty_makes_no_query(monkeypatch: pytest.MonkeyPatch) -> None:
    client = FakeClient()
    _use(monkeypatch, client)

    asyncio.run(seed_store.upsert_seeds([], "JP"))

    assert client.queries == []


def test_get_seeds_by_band_orders_oldest_first_with_nulls_first(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    row = {
        "puuid": "a",
        "tier": "MASTER",
        "division": None,
        "league_points": 100,
        "refreshed_at": "2026-11-06T12:00:00+00:00",
        "last_crawled_at": None,
    }
    client = FakeClient([row])
    _use(monkeypatch, client)

    seeds = asyncio.run(seed_store.get_seeds_by_band(["MASTER", "CHALLENGER"], 5))

    assert [s.puuid for s in seeds] == ["a"]
    query = client.queries[0][1]
    assert query.call("in_") == (("tier", ["MASTER", "CHALLENGER"]), {})
    assert query.call("order") == (
        ("last_crawled_at",),
        {"desc": False, "nullsfirst": True},
    )
    assert query.call("limit") == ((5,), {})


def test_mark_crawled_updates_one_seed(monkeypatch: pytest.MonkeyPatch) -> None:
    client = FakeClient()
    _use(monkeypatch, client)

    asyncio.run(seed_store.mark_crawled("a", T))

    query = client.queries[0][1]
    assert query.call("update") == (({"last_crawled_at": T.isoformat()},), {})
    assert query.call("eq") == (("puuid", "a"), {})


def test_delete_stale_seeds_returns_deleted_count(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    class CountingQuery(FakeQuery):
        def execute(self) -> SimpleNamespace:
            return SimpleNamespace(data=[], count=7)

    query = CountingQuery([])

    class Client:
        def table(self, name: str) -> CountingQuery:
            assert name == "crawler_seeds"
            return query

    _use(monkeypatch, Client())

    assert asyncio.run(seed_store.delete_stale_seeds(T)) == 7
    _, kwargs = query.call("delete")
    assert kwargs == {"count": CountMethod.exact, "returning": ReturnMethod.minimal}
    assert query.call("lt") == (("refreshed_at", T.isoformat()), {})
