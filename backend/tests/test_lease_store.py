"""adapters/worker_lease_store.py のテスト: 取得・期限切れ後の再取得・二重取得の拒否・返却。

Supabase は、worker_leases の UPDATE / upsert だけを解釈するメモリ上の代役にする。
load_store で adapters/ のモジュールを読み込むため、test_router_properties.py
（sys.modules["adapters"] を差し替える）より前に収集されるファイル名にしている。

_Requirements: 3.2_
"""

import asyncio
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from typing import Any

import pytest

from tests.store_helpers import load_store

lease_store = load_store("worker_lease_store.py")

T0 = datetime(2026, 1, 1, 12, 0, tzinfo=timezone.utc)
TTL = timedelta(minutes=6)


class FakeLeaseQuery:
    """update(...).eq(...).or_(...) / upsert(...) を解釈して、メモリ上の行を操作する。"""

    def __init__(self, rows: dict[str, dict[str, Any]], now: datetime) -> None:
        self.rows = rows
        self.now = now
        self.op: str | None = None
        self.payload: Any = None
        self.filters: dict[str, Any] = {}
        self.or_text: str | None = None
        self.options: dict[str, Any] = {}

    def update(self, payload: dict[str, Any]) -> "FakeLeaseQuery":
        self.op, self.payload = "update", payload
        return self

    def upsert(self, payload: dict[str, Any], **options: Any) -> "FakeLeaseQuery":
        self.op, self.payload, self.options = "upsert", payload, options
        return self

    def eq(self, column: str, value: Any) -> "FakeLeaseQuery":
        self.filters[column] = value
        return self

    def or_(self, text: str) -> "FakeLeaseQuery":
        self.or_text = text
        return self

    def _expired(self, row: dict[str, Any]) -> bool:
        """or_ の条件「expires_at.is.null,expires_at.lt.<時刻>」を評価する。"""
        if self.or_text is None:
            return True
        _, threshold_text = self.or_text.split(",expires_at.lt.")
        threshold = datetime.strptime(threshold_text, "%Y-%m-%dT%H:%M:%S%z")
        expires_at = row["expires_at"]
        return expires_at is None or datetime.fromisoformat(expires_at) < threshold

    def execute(self) -> SimpleNamespace:
        if self.op == "upsert":
            assert self.options == {"on_conflict": "name", "ignore_duplicates": True}
            name = self.payload["name"]
            if name in self.rows:
                return SimpleNamespace(data=[])
            self.rows[name] = dict(self.payload)
            return SimpleNamespace(data=[self.rows[name]])
        matched = [
            row
            for row in self.rows.values()
            if all(row.get(k) == v for k, v in self.filters.items())
            and self._expired(row)
        ]
        for row in matched:
            row.update(self.payload)
        return SimpleNamespace(data=matched)


class FakeLeaseClient:
    def __init__(self) -> None:
        self.rows: dict[str, dict[str, Any]] = {}
        self.now = T0

    def table(self, name: str) -> FakeLeaseQuery:
        assert name == "worker_leases"
        return FakeLeaseQuery(self.rows, self.now)


@pytest.fixture
def db(monkeypatch: pytest.MonkeyPatch) -> FakeLeaseClient:
    client = FakeLeaseClient()
    monkeypatch.setattr(lease_store, "supabase", client)
    monkeypatch.setattr(lease_store, "_now", lambda: client.now)
    return client


def _acquire(holder: str, name: str = "riot-backfill") -> bool:
    return bool(asyncio.run(lease_store.try_acquire(name, holder, TTL)))


def test_first_acquire_inserts_row_with_expiry(db: FakeLeaseClient) -> None:
    assert _acquire("a") is True
    row = db.rows["riot-backfill"]
    assert row["holder"] == "a"
    assert datetime.fromisoformat(row["expires_at"]) == T0 + TTL


def test_second_acquire_while_held_is_rejected(db: FakeLeaseClient) -> None:
    assert _acquire("a") is True
    db.now = T0 + timedelta(minutes=1)

    assert _acquire("b") is False
    assert db.rows["riot-backfill"]["holder"] == "a"


def test_acquire_after_expiry_succeeds(db: FakeLeaseClient) -> None:
    assert _acquire("a") is True
    db.now = T0 + TTL + timedelta(seconds=2)

    assert _acquire("b") is True
    assert db.rows["riot-backfill"]["holder"] == "b"


def test_release_allows_immediate_reacquire(db: FakeLeaseClient) -> None:
    assert _acquire("a") is True
    asyncio.run(lease_store.release("riot-backfill", "a"))

    assert db.rows["riot-backfill"]["expires_at"] is None
    assert _acquire("b") is True


def test_release_by_other_holder_does_nothing(db: FakeLeaseClient) -> None:
    """期限切れ後に他の実行が取得していたら、元の実行の返却は影響しない。"""
    assert _acquire("a") is True
    db.now = T0 + TTL + timedelta(seconds=2)
    assert _acquire("b") is True

    asyncio.run(lease_store.release("riot-backfill", "a"))

    assert db.rows["riot-backfill"]["holder"] == "b"
    assert _acquire("c") is False


def test_leases_with_different_names_are_independent(db: FakeLeaseClient) -> None:
    assert _acquire("a", "riot-backfill") is True
    assert _acquire("b", "crawler") is True


def test_concurrent_insert_conflict_returns_false(
    monkeypatch: pytest.MonkeyPatch, db: FakeLeaseClient
) -> None:
    """UPDATE の時点で行がなく、INSERT の前に他が作った場合（重複は無視される）。"""
    original = FakeLeaseQuery.execute
    state = {"first": True}

    def racing(self: FakeLeaseQuery) -> SimpleNamespace:
        if self.op == "update" and state["first"]:
            state["first"] = False
            result = original(self)
            self.rows["riot-backfill"] = {
                "name": "riot-backfill",
                "holder": "other",
                "expires_at": (T0 + TTL).isoformat(),
            }
            return result
        return original(self)

    monkeypatch.setattr(FakeLeaseQuery, "execute", racing)

    assert _acquire("a") is False
    assert db.rows["riot-backfill"]["holder"] == "other"
