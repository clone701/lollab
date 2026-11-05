"""adapters/failed_match_store.py のユニットテスト（Supabase はモック）。

_Requirements: 3.7, 3.8_
"""

import asyncio

import pytest

from schemas.riot_fetch import FailedFetch
from tests.store_helpers import FakeClient, load_store

failed_store = load_store("failed_match_store.py")


def _use(monkeypatch: pytest.MonkeyPatch, client: FakeClient) -> None:
    monkeypatch.setattr(failed_store, "supabase", client)


def test_get_gave_up_match_ids_filters_by_gave_up(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = FakeClient([{"match_id": "JP1_2"}])
    _use(monkeypatch, client)

    result = asyncio.run(failed_store.get_gave_up_match_ids(["JP1_1", "JP1_2"]))

    assert result == {"JP1_2"}
    table, query = client.queries[0]
    assert table == "failed_matches"
    assert query.call("in_") == (("match_id", ["JP1_1", "JP1_2"]), {})
    assert query.call("eq") == (("gave_up", True), {})


def test_record_new_failure_starts_at_one_attempt(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """記録のない試合は attempts = 1、gave_up = false で登録する。"""
    client = FakeClient([], [])
    _use(monkeypatch, client)

    gave_up = asyncio.run(
        failed_store.record_failed_matches(
            [FailedFetch(match_id="JP1_1", error="HTTP 500")], 3
        )
    )

    assert gave_up == set()
    row = client.queries[1][1].call("upsert")[0][0][0]
    assert (row["match_id"], row["attempts"], row["gave_up"]) == ("JP1_1", 1, False)
    assert row["last_error"] == "HTTP 500"
    assert client.queries[1][1].call("upsert")[1] == {"on_conflict": "match_id"}


def test_record_increments_attempts_and_gives_up_at_max(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """既存の attempts に加算し、上限に達した試合は gave_up = true にする。"""
    existing = [
        {"match_id": "JP1_1", "attempts": 2, "gave_up": False},
        {"match_id": "JP1_2", "attempts": 1, "gave_up": False},
    ]
    client = FakeClient(existing, [])
    _use(monkeypatch, client)
    failures = [
        FailedFetch(match_id="JP1_1", error="HTTP 500"),
        FailedFetch(match_id="JP1_2", error="ReadTimeout"),
    ]

    gave_up = asyncio.run(failed_store.record_failed_matches(failures, 3))

    assert gave_up == {"JP1_1"}
    rows = {r["match_id"]: r for r in client.queries[1][1].call("upsert")[0][0]}
    assert (rows["JP1_1"]["attempts"], rows["JP1_1"]["gave_up"]) == (3, True)
    assert (rows["JP1_2"]["attempts"], rows["JP1_2"]["gave_up"]) == (2, False)


def test_record_keeps_gave_up_and_truncates_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """取得不能は維持し、last_error は長さを制限する。"""
    client = FakeClient([{"match_id": "JP1_1", "attempts": 3, "gave_up": True}], [])
    _use(monkeypatch, client)

    asyncio.run(
        failed_store.record_failed_matches(
            [FailedFetch(match_id="JP1_1", error="E" * 500)], 5
        )
    )

    row = client.queries[1][1].call("upsert")[0][0][0]
    assert row["gave_up"] is True and row["attempts"] == 4
    assert len(row["last_error"]) == 100


def test_record_without_failures_makes_no_query(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = FakeClient()
    _use(monkeypatch, client)

    assert asyncio.run(failed_store.record_failed_matches([], 3)) == set()
    assert client.queries == []


def test_delete_failed_matches(monkeypatch: pytest.MonkeyPatch) -> None:
    client = FakeClient()
    _use(monkeypatch, client)

    asyncio.run(failed_store.delete_failed_matches(["JP1_1", "JP1_2"]))

    table, query = client.queries[0]
    assert table == "failed_matches"
    assert "delete" in query.names()
    assert query.call("in_") == (("match_id", ["JP1_1", "JP1_2"]), {})
    asyncio.run(failed_store.delete_failed_matches([]))
    assert len(client.queries) == 1
