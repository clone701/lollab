"""matches テーブルのうち、試合詳細 API が使う読み出し。

Supabase クライアントは同期 API のため、query_runner 経由で呼び出す。
"""

from adapters.query_runner import execute as _execute
from adapters.supabase import supabase


async def get_raw_bundle_key(match_id: str) -> tuple[bool, str | None]:
    """試合の (存在するか, 生データのまとめファイルのキー) を返す。

    試合がなければ (False, None)。試合はあるがキーがなければ (True, None)。
    """
    rows = await _execute(
        lambda: supabase.table("matches")
        .select("raw_bundle_key")
        .eq("match_id", match_id)
        .limit(1)
    )
    if not rows:
        return False, None
    return True, rows[0].get("raw_bundle_key") or None
