"""adapters/raw_store.py のユニットテスト: gzip の往復・パス・上書き（Storage は代役）。

_Requirements: 4.8, 12.4_
"""

import asyncio
import gzip
import json
from typing import Any

import pytest

from tests.store_helpers import load_store

raw_store = load_store("raw_store.py")


class FakeBucket:
    """Supabase Storage のバケットの代役。ファイルをメモリに持つ。"""

    def __init__(self) -> None:
        self.files: dict[str, bytes] = {}
        self.uploads: list[tuple[str, dict[str, Any]]] = []

    def upload(self, path: str, data: bytes, options: dict[str, Any]) -> None:
        self.uploads.append((path, options))
        self.files[path] = data

    def download(self, path: str) -> bytes:
        if path not in self.files:
            raise RuntimeError("Object not found")
        return self.files[path]


@pytest.fixture(autouse=True)
def supabase_storage(monkeypatch: pytest.MonkeyPatch) -> None:
    """RAW_BUCKET が設定されていても、このファイルは Supabase Storage の経路を検証する。"""
    monkeypatch.setattr(raw_store, "_s3_bucket_name", lambda: "")


@pytest.fixture
def bucket(monkeypatch: pytest.MonkeyPatch) -> FakeBucket:
    fake = FakeBucket()
    monkeypatch.setattr(raw_store, "_bucket", lambda: fake)
    return fake


def test_detail_round_trip_is_gzip_at_expected_path(bucket: FakeBucket) -> None:
    payload = {"metadata": {"matchId": "JP1_1"}, "info": {"name": "日本語"}}

    asyncio.run(raw_store.save_detail("JP1_1", payload))

    assert list(bucket.files) == ["matches/JP1_1/detail.json.gz"]
    assert (
        json.loads(gzip.decompress(bucket.files["matches/JP1_1/detail.json.gz"]))
        == payload
    )
    assert asyncio.run(raw_store.load_detail("JP1_1")) == payload


def test_timeline_round_trip_is_gzip_at_expected_path(bucket: FakeBucket) -> None:
    payload = {"info": {"frames": [{"events": [{"type": "ITEM_PURCHASED"}]}]}}

    asyncio.run(raw_store.save_timeline("JP1_1", payload))

    assert list(bucket.files) == ["matches/JP1_1/timeline.json.gz"]
    assert asyncio.run(raw_store.load_timeline("JP1_1")) == payload


def test_save_overwrites_same_path(bucket: FakeBucket) -> None:
    """同じパスへの再保存は上書き（upsert）で行い、内容が置き換わる。"""
    asyncio.run(raw_store.save_detail("JP1_1", {"version": 1}))
    asyncio.run(raw_store.save_detail("JP1_1", {"version": 2}))

    assert all(options["upsert"] == "true" for _, options in bucket.uploads)
    assert all(
        options["content-type"] == "application/gzip" for _, options in bucket.uploads
    )
    assert asyncio.run(raw_store.load_detail("JP1_1")) == {"version": 2}


def test_load_returns_none_when_missing(bucket: FakeBucket) -> None:
    assert asyncio.run(raw_store.load_detail("JP1_404")) is None
    assert asyncio.run(raw_store.load_timeline("JP1_404")) is None


def test_save_propagates_storage_errors(monkeypatch: pytest.MonkeyPatch) -> None:
    """保存の失敗は呼び出し元に伝える（ログのみで続行する判断は services 側）。"""

    def _broken() -> Any:
        raise RuntimeError("storage down")

    monkeypatch.setattr(raw_store, "_bucket", _broken)

    with pytest.raises(RuntimeError):
        asyncio.run(raw_store.save_detail("JP1_1", {}))
