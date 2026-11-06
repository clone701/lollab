"""adapters/raw_bundle_store.py の find_in_bundle のテスト（S3 は moto。実際の AWS には接続しない）。

_Requirements: 4.1
"""

import asyncio
import gzip
import io
import json
from collections.abc import Iterator
from typing import Any
from unittest.mock import MagicMock

import boto3
import pytest
from moto import mock_aws

from adapters import raw_bundle_store, raw_store
from adapters.raw_bundle_store import BundleArchive, find_in_bundle

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


def _write_bundle(matches: dict[str, tuple[Any, Any]]) -> None:
    """{match_id: (detail, timeline)} をまとめファイルに書く（None は書かない）。"""
    archive = BundleArchive(KEY)

    async def run() -> None:
        for match_id, (detail, timeline) in matches.items():
            if detail is not None:
                await archive.save_detail(match_id, detail)
            if timeline is not None:
                await archive.save_timeline(match_id, timeline)
        await archive.flush()

    asyncio.run(run())


def test_returns_only_the_requested_match(s3: Any) -> None:
    _write_bundle(
        {
            "JP1_1": ({"id": 1, "name": "日本語"}, {"tl": 1}),
            "JP1_12": ({"id": 12}, {"tl": 12}),
            "JP1_2": ({"id": 2}, {"tl": 2}),
        }
    )

    assert asyncio.run(find_in_bundle(KEY, "JP1_1")) == (
        {"id": 1, "name": "日本語"},
        {"tl": 1},
    )
    # 前方一致の別の試合（JP1_12）と取り違えない
    assert asyncio.run(find_in_bundle(KEY, "JP1_12")) == ({"id": 12}, {"tl": 12})


def test_missing_match_returns_none_pair(s3: Any) -> None:
    _write_bundle({"JP1_1": ({"id": 1}, {"tl": 1})})

    assert asyncio.run(find_in_bundle(KEY, "JP1_999")) == (None, None)


def test_match_without_timeline_returns_none_for_timeline(s3: Any) -> None:
    _write_bundle({"JP1_1": ({"id": 1}, None)})

    assert asyncio.run(find_in_bundle(KEY, "JP1_1")) == ({"id": 1}, None)


def test_missing_bundle_file_returns_none_pair(s3: Any) -> None:
    """書き込みに失敗してキーだけが残った場合は、見つからない扱いにする。"""
    assert asyncio.run(find_in_bundle("bundles/none.jsonl.gz", "JP1_1")) == (
        None,
        None,
    )


def test_corrupted_bundle_returns_none_pair(s3: Any) -> None:
    s3.put_object(Bucket=BUCKET, Key=KEY, Body=b"not gzip")

    assert asyncio.run(find_in_bundle(KEY, "JP1_1")) == (None, None)


def test_stream_is_closed_after_reading(monkeypatch: pytest.MonkeyPatch) -> None:
    """読み終えたストリームを閉じる（S3 の接続を残さない）。"""
    lines = [
        {"match_id": "JP1_1", "kind": "detail", "data": {"id": 1}},
        {"match_id": "JP1_1", "kind": "timeline", "data": {"tl": 1}},
        {"match_id": "JP1_2", "kind": "detail", "data": {"id": 2}},
    ]
    raw = b"".join(
        json.dumps(line, separators=(",", ":")).encode() + b"\n" for line in lines
    )

    class Stream(io.BytesIO):
        closed_by_reader = False

        def close(self) -> None:
            Stream.closed_by_reader = True
            super().close()

    compressed = gzip.compress(raw)
    monkeypatch.setattr(raw_store, "open_stream", lambda path: Stream(compressed))

    assert asyncio.run(find_in_bundle(KEY, "JP1_1")) == ({"id": 1}, {"tl": 1})
    assert Stream.closed_by_reader


def test_unset_bucket_reads_from_supabase_storage(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """RAW_BUCKET 未設定のローカルでは、S3 を呼ばず Supabase Storage から同じキーで読む。"""
    stored: dict[str, bytes] = {}
    bucket = MagicMock()
    bucket.upload.side_effect = lambda path, data, options: stored.update({path: data})
    bucket.download.side_effect = lambda path: stored[path]
    monkeypatch.setattr(raw_store, "_s3_bucket_name", lambda: "")
    monkeypatch.setattr(raw_store, "_bucket", lambda: bucket)
    monkeypatch.setattr(raw_store, "_s3", lambda: pytest.fail("S3 を呼んではいけない"))
    _write_bundle({"JP1_1": ({"id": 1}, {"tl": 1})})

    assert asyncio.run(raw_bundle_store.find_in_bundle(KEY, "JP1_1")) == (
        {"id": 1},
        {"tl": 1},
    )
    bucket.download.assert_called_once_with(KEY)
