"""seasons テーブルへのアクセス層。

services 層はこのモジュールの関数だけを使い、Supabase を直接参照しない。
Supabase クライアントは同期 API のため、query_runner 経由で asyncio.to_thread で呼び出す。
"""

from datetime import datetime

from pydantic import TypeAdapter

from adapters.query_runner import execute as _execute
from adapters.supabase import supabase

_DATETIME = TypeAdapter(datetime)


async def get_earliest_start_at(id_prefix: str) -> datetime | None:
    """id が id_prefix で始まるシーズンのうち、最も早い start_at を返す。なければ None。

    id_prefix は LIKE のパターンに埋め込むため、呼び出し側で `2026-` のような
    英数字とハイフンだけの文字列に限定すること（% や _ を含めない）。
    """
    rows = await _execute(
        lambda: supabase.table("seasons")
        .select("start_at")
        .like("id", f"{id_prefix}%")
        .order("start_at")
        .limit(1)
    )
    return _DATETIME.validate_python(rows[0]["start_at"]) if rows else None
