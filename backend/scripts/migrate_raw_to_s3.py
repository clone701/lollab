"""Supabase Storage の riot-raw の全オブジェクトを S3 にコピーする移行スクリプト。

backend/ で実行する（.env の SUPABASE_URL・SUPABASE_KEY と AWS の認証情報が必要）。

    python -m scripts.migrate_raw_to_s3 --dry-run
    python -m scripts.migrate_raw_to_s3 --bucket lollab-raw
    python -m scripts.migrate_raw_to_s3 --bucket lollab-raw --delete-source

- --dry-run: コピー対象の件数とサイズを表示するだけ（S3 には接続しない）
- コピー後に、件数とサイズを S3 側と照合する。再実行しても、同じサイズで保存済みの
  オブジェクトは飛ばす
- --delete-source: 照合が一致したときだけ、Supabase 側のコピー済みオブジェクトを削除する
"""

import argparse
import sys
from collections.abc import Iterator, Sequence
from dataclasses import dataclass
from typing import Any

from botocore.exceptions import ClientError

SOURCE_BUCKET = "riot-raw"
PREFIX = "matches"
_PAGE_SIZE = 1000
_DELETE_CHUNK = 100
_NOT_FOUND_CODES = ("404", "NoSuchKey", "NotFound")


@dataclass(frozen=True)
class RawObject:
    path: str
    size: int | None  # Storage の一覧に大きさがない場合は None


def _list_dir(bucket: Any, path: str) -> Iterator[dict[str, Any]]:
    offset = 0
    while True:
        page = bucket.list(path, {"limit": _PAGE_SIZE, "offset": offset})
        yield from page
        if len(page) < _PAGE_SIZE:
            return
        offset += _PAGE_SIZE


def list_source(bucket: Any, prefix: str = PREFIX) -> list[RawObject]:
    """Supabase Storage の prefix 配下の全ファイルを、パス順に返す。"""
    objects: list[RawObject] = []
    folders = [prefix]
    while folders:
        base = folders.pop()
        for entry in _list_dir(bucket, base):
            path = f"{base}/{entry['name']}"
            if entry.get("id") is None:  # フォルダ
                folders.append(path)
                continue
            size = (entry.get("metadata") or {}).get("size")
            objects.append(RawObject(path, int(size) if size is not None else None))
    return sorted(objects, key=lambda o: o.path)


def _s3_size(s3: Any, s3_bucket: str, key: str) -> int | None:
    try:
        return int(s3.head_object(Bucket=s3_bucket, Key=key)["ContentLength"])
    except ClientError as e:
        if e.response.get("Error", {}).get("Code") in _NOT_FOUND_CODES:
            return None
        raise


def copy_objects(
    bucket: Any, s3: Any, s3_bucket: str, objects: Sequence[RawObject]
) -> int:
    """S3 にないオブジェクト（またはサイズが違うもの）をコピーし、コピーした件数を返す。"""
    copied = 0
    for obj in objects:
        if obj.size is not None and _s3_size(s3, s3_bucket, obj.path) == obj.size:
            continue
        data = bucket.download(obj.path)
        s3.put_object(
            Bucket=s3_bucket,
            Key=obj.path,
            Body=data,
            ContentType="application/gzip",
        )
        copied += 1
    return copied


def verify(
    s3: Any, s3_bucket: str, objects: Sequence[RawObject]
) -> tuple[int, int, list[str]]:
    """S3 側と照合する。

    Returns:
        (S3 側にある件数, そのサイズの合計, 無い・サイズが違うパスの一覧)
    """
    s3_sizes: dict[str, int] = {}
    paginator = s3.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=s3_bucket, Prefix=f"{PREFIX}/"):
        for item in page.get("Contents", []):
            s3_sizes[item["Key"]] = int(item["Size"])
    mismatched = [
        o.path
        for o in objects
        if o.path not in s3_sizes or (o.size is not None and s3_sizes[o.path] != o.size)
    ]
    found = [s3_sizes[o.path] for o in objects if o.path in s3_sizes]
    return len(found), sum(found), mismatched


def delete_source(bucket: Any, objects: Sequence[RawObject]) -> None:
    """Supabase Storage のオブジェクトを削除する。"""
    paths = [o.path for o in objects]
    for i in range(0, len(paths), _DELETE_CHUNK):
        bucket.remove(paths[i : i + _DELETE_CHUNK])


def run(
    bucket: Any,
    s3: Any,
    s3_bucket: str,
    dry_run: bool,
    delete: bool,
) -> int:
    """移行を実行して終了コードを返す（0 = 成功、1 = 照合が一致しない）。"""
    objects = list_source(bucket)
    total = sum(o.size or 0 for o in objects)
    print(f"コピー元: {len(objects)} 件, {total} バイト")
    if dry_run:
        print("--dry-run のため、コピー・削除は行いません")
        return 0

    print(f"コピーしました: {copy_objects(bucket, s3, s3_bucket, objects)} 件")
    found, found_size, mismatched = verify(s3, s3_bucket, objects)
    print(f"コピー先: {found} 件, {found_size} バイト")
    if mismatched:
        print(f"照合が一致しません（{len(mismatched)} 件）。先頭: {mismatched[:5]}")
        return 1
    print("照合が一致しました")
    if delete:
        delete_source(bucket, objects)
        print(f"コピー元を削除しました: {len(objects)} 件")
    return 0


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=(__doc__ or "").splitlines()[0])
    parser.add_argument(
        "--bucket", help="コピー先の S3 バケット（省略時は RAW_BUCKET）"
    )
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--delete-source", action="store_true")
    args = parser.parse_args(argv)
    if args.dry_run and args.delete_source:
        parser.error("--dry-run と --delete-source は同時に指定できません")

    from adapters.supabase import supabase
    from config import settings

    s3_bucket = args.bucket or settings.raw_bucket
    if not s3_bucket and not args.dry_run:
        parser.error("--bucket または RAW_BUCKET が必要です")

    s3 = None
    if not args.dry_run:
        import boto3

        s3 = boto3.client("s3")
    source = supabase.storage.from_(SOURCE_BUCKET)
    return run(source, s3, s3_bucket, args.dry_run, args.delete_source)


if __name__ == "__main__":
    sys.exit(main())
