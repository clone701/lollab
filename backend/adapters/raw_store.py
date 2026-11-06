"""試合の生データ（Riot API のレスポンス）の保管。

RAW_BUCKET が設定されていれば S3、未設定（ローカル）なら Supabase Storage の
非公開バケット riot-raw に、gzip 圧縮して保存する。パスはどちらも同じ。
同期 API のため asyncio.to_thread で呼び出す。
"""

import asyncio
import gzip
import json
import logging
from typing import Any, Protocol

from config import settings

logger = logging.getLogger(__name__)

BUCKET_NAME = "riot-raw"


def detail_path(match_id: str) -> str:
    return f"matches/{match_id}/detail.json.gz"


def timeline_path(match_id: str) -> str:
    return f"matches/{match_id}/timeline.json.gz"


def _bucket() -> Any:
    # Supabase クライアントは import 時に作られる。環境変数なしのテストで
    # このモジュールを読み込めるよう、使う時点で import する
    from adapters.supabase import supabase

    return supabase.storage.from_(BUCKET_NAME)


_s3_client: Any | None = None


def _s3_bucket_name() -> str:
    """保存先の S3 バケット名。未設定なら空文字（Supabase Storage を使う）。"""
    return settings.raw_bucket


def _s3() -> Any:
    global _s3_client
    if _s3_client is None:
        import boto3

        _s3_client = boto3.client("s3")
    return _s3_client


def _upload(path: str, payload: dict[str, Any]) -> None:
    data = gzip.compress(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    _put(path, data)


def _put(path: str, data: bytes) -> None:
    """圧縮済みのデータを保管先（S3 または Supabase Storage）に1回書き込む。"""
    s3_bucket = _s3_bucket_name()
    if s3_bucket:
        _s3().put_object(
            Bucket=s3_bucket, Key=path, Body=data, ContentType="application/gzip"
        )
        return
    _bucket().upload(path, data, {"content-type": "application/gzip", "upsert": "true"})


def _read(path: str) -> bytes:
    s3_bucket = _s3_bucket_name()
    if s3_bucket:
        body = _s3().get_object(Bucket=s3_bucket, Key=path)["Body"]
        return body.read()  # type: ignore[no-any-return]
    return _bucket().download(path)  # type: ignore[no-any-return]


def _download(path: str) -> dict[str, Any] | None:
    try:
        data = _read(path)
        return json.loads(gzip.decompress(data))  # type: ignore[no-any-return]
    except Exception:
        # 未保存（ファイルなし）を含め、読み出せない場合は None にする
        logger.info("生データを読み出せませんでした: %s", path)
        return None


async def save_detail(match_id: str, payload: dict[str, Any]) -> None:
    """試合詳細を保存する（同じパスは上書き）。失敗時は例外を送出する。"""
    await asyncio.to_thread(_upload, detail_path(match_id), payload)


async def save_timeline(match_id: str, payload: dict[str, Any]) -> None:
    """タイムラインを保存する（同じパスは上書き）。失敗時は例外を送出する。"""
    await asyncio.to_thread(_upload, timeline_path(match_id), payload)


async def put_gzip(path: str, data: bytes) -> None:
    """gzip 済みのデータを path に保存する（同じパスは上書き）。失敗時は例外を送出する。"""
    await asyncio.to_thread(_put, path, data)


async def load_detail(match_id: str) -> dict[str, Any] | None:
    """保存済みの試合詳細を返す。未保存・読み出し失敗は None。"""
    return await asyncio.to_thread(_download, detail_path(match_id))


async def load_timeline(match_id: str) -> dict[str, Any] | None:
    """保存済みのタイムラインを返す。未保存・読み出し失敗は None。"""
    return await asyncio.to_thread(_download, timeline_path(match_id))


class RawArchive(Protocol):
    """生データの保管先。試合の取得処理（match_bundle）が受け取る。"""

    async def save_detail(self, match_id: str, payload: dict[str, Any]) -> None: ...

    async def save_timeline(self, match_id: str, payload: dict[str, Any]) -> None: ...


class PerMatchArchive:
    """既定の保管先: 1試合1ファイル（matches/{match_id}/…）。検索・Backfill が使う。"""

    async def save_detail(self, match_id: str, payload: dict[str, Any]) -> None:
        await save_detail(match_id, payload)

    async def save_timeline(self, match_id: str, payload: dict[str, Any]) -> None:
        await save_timeline(match_id, payload)
