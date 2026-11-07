"""adapters/season_store.py のユニットテスト（Supabase はモック）。"""

import asyncio
from datetime import datetime, timezone

import pytest

from tests.store_helpers import FakeClient
from tests.store_helpers import season_store as store


def test_get_earliest_start_at_queries_prefix_in_start_order(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """id の前方一致で絞り、start_at の昇順の先頭1件を取る。"""
    client = FakeClient([{"start_at": "2026-01-08T00:00:00+00:00"}])
    monkeypatch.setattr(store, "supabase", client)

    result = asyncio.run(store.get_earliest_start_at("2026-"))

    assert result == datetime(2026, 1, 8, tzinfo=timezone.utc)
    table, query = client.queries[0]
    assert table == "seasons"
    assert query.call("like") == (("id", "2026-%"), {})
    assert query.call("order") == (("start_at",), {})
    assert query.call("limit") == ((1,), {})


def test_get_earliest_start_at_none_when_no_season(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(store, "supabase", FakeClient([]))

    assert asyncio.run(store.get_earliest_start_at("2026-")) is None
