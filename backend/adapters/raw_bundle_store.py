"""生データのまとめ保存: 1回の起動で集めた試合を1つのファイルにする（クローラー用）。

受け取った JSON を1行ずつ（{"match_id", "kind", "data"}）gzip のストリームに追記し、
flush で保管先に1回だけ書き込む。保管先は raw_store と同じ（RAW_BUCKET があれば S3、
未設定のローカルでは Supabase Storage の riot-raw）。
"""

import gzip
import io
import json
import re
from datetime import datetime, timezone
from typing import Any

from adapters import raw_store

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
