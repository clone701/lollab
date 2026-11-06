"""adapters/raw_store.py の S3 経路のテスト（moto で S3 をモックし、実際の AWS には接続しない）。

RAW_BUCKET が設定されていれば S3、未設定なら Supabase Storage。パスは同じ。

_Requirements: 4.1, 4.3_
"""

import asyncio
import gzip
import json
from collections.abc import Iterator
from typing import Any
from unittest.mock import MagicMock

import boto3
import pytest
from moto import mock_aws

from tests.store_helpers import load_store

raw_store = load_store("raw_store.py")

BUCKET = "lollab-raw-test"


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


def test_detail_round_trip_uses_same_path_and_gzip(s3: Any) -> None:
    payload = {"metadata": {"matchId": "JP1_1"}, "info": {"name": "日本語"}}

    asyncio.run(raw_store.save_detail("JP1_1", payload))

    obj = s3.get_object(Bucket=BUCKET, Key="matches/JP1_1/detail.json.gz")
    assert obj["ContentType"] == "application/gzip"
    assert json.loads(gzip.decompress(obj["Body"].read())) == payload
    assert asyncio.run(raw_store.load_detail("JP1_1")) == payload


def test_timeline_round_trip(s3: Any) -> None:
    payload: dict[str, Any] = {"info": {"frames": [{"events": []}]}}

    asyncio.run(raw_store.save_timeline("JP1_1", payload))

    keys = [o["Key"] for o in s3.list_objects_v2(Bucket=BUCKET)["Contents"]]
    assert keys == ["matches/JP1_1/timeline.json.gz"]
    assert asyncio.run(raw_store.load_timeline("JP1_1")) == payload


def test_save_overwrites_same_key(s3: Any) -> None:
    asyncio.run(raw_store.save_detail("JP1_1", {"version": 1}))
    asyncio.run(raw_store.save_detail("JP1_1", {"version": 2}))

    assert asyncio.run(raw_store.load_detail("JP1_1")) == {"version": 2}
    assert s3.list_objects_v2(Bucket=BUCKET)["KeyCount"] == 1


def test_load_returns_none_when_missing(s3: Any) -> None:
    assert asyncio.run(raw_store.load_detail("JP1_404")) is None


def test_save_propagates_s3_errors(s3: Any, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(raw_store, "_s3_bucket_name", lambda: "no-such-bucket")

    with pytest.raises(Exception):
        asyncio.run(raw_store.save_detail("JP1_1", {}))


def test_unset_bucket_uses_supabase_storage(monkeypatch: pytest.MonkeyPatch) -> None:
    """RAW_BUCKET 未設定のローカルでは、S3 を呼ばず Supabase Storage に保存する。"""
    supabase_bucket = MagicMock()
    monkeypatch.setattr(raw_store, "_s3_bucket_name", lambda: "")
    monkeypatch.setattr(raw_store, "_bucket", lambda: supabase_bucket)
    monkeypatch.setattr(raw_store, "_s3", lambda: pytest.fail("S3 を呼んではいけない"))

    asyncio.run(raw_store.save_detail("JP1_1", {"a": 1}))

    path = supabase_bucket.upload.call_args.args[0]
    assert path == "matches/JP1_1/detail.json.gz"
