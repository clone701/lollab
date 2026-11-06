"""adapters/raw_bundle_store.py のテスト（S3 は moto。実際の AWS には接続しない）。

_Requirements: 4.4_
"""

import asyncio
import gzip
import json
from collections.abc import Iterator
from datetime import datetime
from typing import Any
from unittest.mock import MagicMock

import boto3
import pytest
from moto import mock_aws

from adapters import raw_store
from adapters.raw_bundle_store import BundleArchive, crawler_bundle_key

BUCKET = "lollab-raw-test"
KEY = "bundles/crawler/2026-11-06/run-1.jsonl.gz"


@pytest.fixture
def s3(monkeypatch: pytest.MonkeyPatch) -> Iterator[Any]:
    for name in ("AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN"):
        monkeypatch.setenv(name, "testing")
    monkeypatch.setenv("AWS_DEFAULT_REGION", "ap-northeast-1")
    with mock_aws():
        client = boto3.client("s3")
        client.create_bucket(
            Bucket=BUCKET,
            CreateBucketConfiguration={"LocationConstraint": "ap-northeast-1"},
        )
        monkeypatch.setattr(raw_store, "_s3_client", None)
        monkeypatch.setattr(raw_store, "_s3_bucket_name", lambda: BUCKET)
        yield client
    raw_store._s3_client = None  # type: ignore[attr-defined]


def _read_lines(s3: Any, key: str = KEY) -> list[dict[str, Any]]:
    body = s3.get_object(Bucket=BUCKET, Key=key)["Body"].read()
    return [json.loads(line) for line in gzip.decompress(body).splitlines()]


def test_appended_lines_can_be_read_back(s3: Any) -> None:
    archive = BundleArchive(KEY)

    async def run() -> int:
        await archive.save_detail("JP1_1", {"info": {"name": "日本語"}})
        await archive.save_timeline("JP1_1", {"frames": []})
        await archive.save_detail("JP1_2", {"info": {}})
        return await archive.flush()

    assert asyncio.run(run()) == 2

    assert _read_lines(s3) == [
        {"match_id": "JP1_1", "kind": "detail", "data": {"info": {"name": "日本語"}}},
        {"match_id": "JP1_1", "kind": "timeline", "data": {"frames": []}},
        {"match_id": "JP1_2", "kind": "detail", "data": {"info": {}}},
    ]
    assert s3.list_objects_v2(Bucket=BUCKET)["KeyCount"] == 1


def test_flush_with_no_matches_writes_nothing(s3: Any) -> None:
    assert asyncio.run(BundleArchive(KEY).flush()) == 0

    assert s3.list_objects_v2(Bucket=BUCKET)["KeyCount"] == 0


def test_flush_propagates_write_errors(
    s3: Any, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(raw_store, "_s3_bucket_name", lambda: "no-such-bucket")
    archive = BundleArchive(KEY)

    async def run() -> None:
        await archive.save_detail("JP1_1", {})
        await archive.flush()

    with pytest.raises(Exception):
        asyncio.run(run())


def test_cannot_append_after_flush(s3: Any) -> None:
    archive = BundleArchive(KEY)

    async def run() -> None:
        await archive.flush()
        await archive.save_detail("JP1_1", {})

    with pytest.raises(RuntimeError):
        asyncio.run(run())


def test_unset_bucket_uses_supabase_storage_with_same_key(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """RAW_BUCKET 未設定のローカルでは、S3 を呼ばず Supabase Storage に同じキーで保存する。"""
    supabase_bucket = MagicMock()
    monkeypatch.setattr(raw_store, "_s3_bucket_name", lambda: "")
    monkeypatch.setattr(raw_store, "_bucket", lambda: supabase_bucket)
    monkeypatch.setattr(raw_store, "_s3", lambda: pytest.fail("S3 を呼んではいけない"))
    archive = BundleArchive(KEY)

    async def run() -> None:
        await archive.save_detail("JP1_1", {"a": 1})
        await archive.flush()

    asyncio.run(run())

    assert supabase_bucket.upload.call_args.args[0] == KEY


def test_key_uses_utc_date_and_safe_run_id() -> None:
    # JST 2026-11-07 08:00 は UTC では 11-06
    jst = datetime.fromisoformat("2026-11-07T08:00:00+09:00")

    assert crawler_bundle_key("abc-123", jst) == (
        "bundles/crawler/2026-11-06/abc-123.jsonl.gz"
    )
    # パス区切りはキーに入らない
    unsafe = crawler_bundle_key("../x/y", jst)
    assert unsafe == "bundles/crawler/2026-11-06/___x_y.jsonl.gz"
