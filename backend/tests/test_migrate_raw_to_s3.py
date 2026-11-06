"""scripts/migrate_raw_to_s3.py のテスト（Supabase Storage は代役、S3 は moto。実接続しない）。

_Requirements: 4.2_
"""

from collections.abc import Iterator
from typing import Any

import boto3
import pytest
from moto import mock_aws

from scripts import migrate_raw_to_s3 as script

BUCKET = "lollab-raw-test"


Entries = list[dict[str, Any]]
Paths = list[str]


class FakeStorageBucket:
    """Supabase Storage のバケットの代役。list はフォルダ構造を 1 階層ずつ返す。"""

    def __init__(self, files: dict[str, bytes]) -> None:
        self.files = dict(files)
        self.removed: Paths = []

    def list(self, path: str, options: dict[str, Any]) -> Entries:
        prefix = f"{path}/"
        entries: dict[str, dict[str, Any]] = {}
        for full, data in sorted(self.files.items()):
            if not full.startswith(prefix):
                continue
            name, _, rest = full[len(prefix) :].partition("/")
            if rest:
                entries[name] = {"name": name, "id": None}
            else:
                entries[name] = {
                    "name": name,
                    "id": f"id-{full}",
                    "metadata": {"size": len(data)},
                }
        page: Entries = [*entries.values()]
        offset = options["offset"]
        return page[offset : offset + options["limit"]]

    def download(self, path: str) -> bytes:
        return self.files[path]

    def remove(self, paths: Paths) -> None:
        self.removed.extend(paths)
        for path in paths:
            del self.files[path]


FILES = {
    "matches/JP1_1/detail.json.gz": b"d1" * 10,
    "matches/JP1_1/timeline.json.gz": b"t1" * 20,
    "matches/JP1_2/detail.json.gz": b"d2" * 30,
}


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
        yield client


def _s3_keys(s3: Any) -> list[str]:
    response = s3.list_objects_v2(Bucket=BUCKET)
    return sorted(o["Key"] for o in response.get("Contents", []))


def test_list_source_walks_folders_and_pages(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(script, "_PAGE_SIZE", 1)  # 1件ずつのページ送りでも全件取れる

    objects = script.list_source(FakeStorageBucket(FILES))

    assert [(o.path, o.size) for o in objects] == [
        ("matches/JP1_1/detail.json.gz", 20),
        ("matches/JP1_1/timeline.json.gz", 40),
        ("matches/JP1_2/detail.json.gz", 60),
    ]


def test_dry_run_only_counts_and_does_not_touch_s3_or_source(
    capsys: pytest.CaptureFixture[str],
) -> None:
    source = FakeStorageBucket(FILES)

    code = script.run(source, None, BUCKET, dry_run=True, delete=False)

    assert code == 0
    assert "3 件, 120 バイト" in capsys.readouterr().out
    assert source.removed == [] and len(source.files) == 3


def test_copy_verifies_and_keeps_source_without_delete_flag(s3: Any) -> None:
    source = FakeStorageBucket(FILES)

    code = script.run(source, s3, BUCKET, dry_run=False, delete=False)

    assert code == 0
    assert _s3_keys(s3) == sorted(FILES)
    body = s3.get_object(Bucket=BUCKET, Key="matches/JP1_2/detail.json.gz")["Body"]
    assert body.read() == FILES["matches/JP1_2/detail.json.gz"]
    assert source.removed == []


def test_delete_source_removes_only_after_verification(s3: Any) -> None:
    source = FakeStorageBucket(FILES)

    code = script.run(source, s3, BUCKET, dry_run=False, delete=True)

    assert code == 0
    assert sorted(source.removed) == sorted(FILES)
    assert source.files == {}
    assert _s3_keys(s3) == sorted(FILES)


def test_size_mismatch_fails_and_keeps_source(
    s3: Any, capsys: pytest.CaptureFixture[str]
) -> None:
    """S3 に欠けたデータがあれば、照合が一致せず、--delete-source でも削除しない。"""
    source = FakeStorageBucket(FILES)
    original_put = s3.put_object

    def truncating_put(**kwargs: Any) -> Any:
        kwargs["Body"] = kwargs["Body"][:-1]
        return original_put(**kwargs)

    s3.put_object = truncating_put

    code = script.run(source, s3, BUCKET, dry_run=False, delete=True)

    assert code == 1
    assert "照合が一致しません（3 件）" in capsys.readouterr().out
    assert source.removed == [] and len(source.files) == 3


def test_missing_object_in_s3_fails_verification(s3: Any) -> None:
    source = FakeStorageBucket(FILES)
    objects = script.list_source(source)
    script.copy_objects(source, s3, BUCKET, objects)
    s3.delete_object(Bucket=BUCKET, Key="matches/JP1_1/timeline.json.gz")

    found, _, mismatched = script.verify(s3, BUCKET, objects)

    assert found == 2
    assert mismatched == ["matches/JP1_1/timeline.json.gz"]


def test_rerun_skips_objects_already_copied(s3: Any) -> None:
    source = FakeStorageBucket(FILES)
    objects = script.list_source(source)

    assert script.copy_objects(source, s3, BUCKET, objects) == 3
    assert script.copy_objects(source, s3, BUCKET, objects) == 0


def test_dry_run_with_delete_source_is_rejected() -> None:
    with pytest.raises(SystemExit):
        script.main(["--dry-run", "--delete-source"])
