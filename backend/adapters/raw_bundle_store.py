"""生データのまとめ保存: 1回の起動で集めた試合を1つのファイルにする（クローラー用）。

受け取った JSON を1行ずつ（{"match_id", "kind", "data"}）gzip のストリームに追記し、
flush で保管先に1回だけ書き込む。保管先は raw_store と同じ（RAW_BUCKET があれば S3、
未設定のローカルでは Supabase Storage の riot-raw）。
"""

import asyncio
import gzip
import io
import json
import logging
import re
from datetime import datetime, timezone
from typing import Any

from adapters import raw_store

logger = logging.getLogger(__name__)

_UNSAFE_KEY_CHARS = re.compile(r"[^A-Za-z0-9_-]")


def crawler_bundle_key(run_id: str, now: datetime | None = None) -> str:
    """クローラーのバンドルのキー: bundles/crawler/{YYYY-MM-DD}/{run_id}.jsonl.gz（UTC）。

    run_id のパス区切りなどはキーに入らないよう "_" に置き換える。
    """
    day = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
    safe_id = _UNSAFE_KEY_CHARS.sub("_", run_id)
    return f"bundles/crawler/{day:%Y-%m-%d}/{safe_id}.jsonl.gz"


class BundleArchive:
    """RawArchive を満たす、まとめ保存の保管先。

    圧縮したデータだけをメモリに持つ（未圧縮の JSON は溜めない）。
    """

    def __init__(self, key: str) -> None:
        self.key = key
        self._buffer = io.BytesIO()
        self._stream: gzip.GzipFile | None = gzip.GzipFile(
            fileobj=self._buffer, mode="wb"
        )
        self._match_ids: set[str] = set()

    async def save_detail(self, match_id: str, payload: dict[str, Any]) -> None:
        self._append(match_id, "detail", payload)

    async def save_timeline(self, match_id: str, payload: dict[str, Any]) -> None:
        self._append(match_id, "timeline", payload)

    def _append(self, match_id: str, kind: str, payload: dict[str, Any]) -> None:
        if self._stream is None:
            raise RuntimeError("flush 済みのバンドルには追記できません")
        line = json.dumps(
            {"match_id": match_id, "kind": kind, "data": payload},
            separators=(",", ":"),
            ensure_ascii=False,
        )
        self._stream.write(line.encode("utf-8") + b"\n")
        self._match_ids.add(match_id)
        # 注意: _line_prefix は、この行の先頭（match_id の直後に kind）の形に依存する

    async def flush(self) -> int:
        """保管先に1回書き込み、書き込んだ試合数を返す。0件なら何も書き込まない。

        Raises:
            Exception: 書き込みに失敗した（呼び出し側がログに残す）
        """
        if self._stream is None:
            return 0
        self._stream.close()
        self._stream = None
        if not self._match_ids:
            return 0
        await raw_store.put_gzip(self.key, self._buffer.getvalue())
        return len(self._match_ids)


def _line_prefix(match_id: str) -> bytes:
    """BundleArchive が書く行の先頭。JSON を解析せずに、別の試合の行を読み飛ばすために使う。"""
    return f'{{"match_id":{json.dumps(match_id)},"kind":'.encode("utf-8")


def _find_sync(
    key: str, match_id: str
) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    prefix = _line_prefix(match_id)
    found: dict[str, dict[str, Any]] = {}
    stream = raw_store.open_stream(key)
    try:
        # 1行ずつ展開する（未圧縮の全体はメモリに載せない）
        with gzip.GzipFile(fileobj=stream, mode="rb") as lines:
            for line in lines:
                if not line.startswith(prefix):
                    continue
                row = json.loads(line)
                if row.get("match_id") == match_id and row.get("kind") in (
                    "detail",
                    "timeline",
                ):
                    found[row["kind"]] = row["data"]
                if len(found) == 2:
                    break
    finally:
        stream.close()
    return found.get("detail"), found.get("timeline")


async def find_in_bundle(
    key: str, match_id: str
) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    """まとめファイルから match_id の (試合詳細, タイムライン) を探して返す。

    ファイルがない・読めない・その試合の行がない場合は、該当するものが None
    （書き込みに失敗したバンドルのキーが残っている場合も、見つからない扱い）。
    """
    try:
        detail, timeline = await asyncio.to_thread(_find_sync, key, match_id)
    except Exception:
        logger.info("まとめファイルを読み出せませんでした: %s", key)
        return None, None
    return detail, timeline
