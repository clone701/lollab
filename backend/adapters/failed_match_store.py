"""failed_matches（取得に失敗した試合）へのアクセス層。

Backfill が、試合詳細の取得に失敗した試合の記録・再取得の判定・成功時の削除に使う。
summoner_store.py の行数を抑えるため、別モジュールに分けている。
"""

from datetime import datetime, timezone
from typing import Any

from adapters.query_runner import execute as _execute
from adapters.supabase import supabase
from schemas.riot_fetch import FailedFetch

# 1回の問い合わせで渡す試合ID数（URL の長さを抑える）
_CHUNK_SIZE = 100

# last_error に保存する最大文字数（ステータスコードや型名だけを想定した防御）
_MAX_ERROR_LENGTH = 100


async def get_gave_up_match_ids(match_ids: list[str]) -> set[str]:
    """match_ids のうち、取得不能（gave_up = true）と判定済みの ID を返す。"""
    result: set[str] = set()
    for i in range(0, len(match_ids), _CHUNK_SIZE):
        chunk = match_ids[i : i + _CHUNK_SIZE]
        rows = await _execute(
            lambda: supabase.table("failed_matches")
            .select("match_id")
            .in_("match_id", chunk)
            .eq("gave_up", True)
        )
        result.update(row["match_id"] for row in rows)
    return result


async def record_failed_matches(
    failures: list[FailedFetch], max_attempts: int
) -> set[str]:
    """取得失敗を記録し、attempts を加算する。

    attempts が max_attempts に達した試合は gave_up = true にする。
    読み取りと書き込みは別のクエリのため、同じ試合を同時に記録すると
    加算が1回分失われることがある（Backfill はサモナー単位で直列に実行する）。

    Returns:
        今回の記録後に gave_up = true になっている試合ID
    """
    latest = {f.match_id: f.error for f in failures}
    if not latest:
        return set()
    ids = list(latest)
    existing: dict[str, tuple[int, bool]] = {}
    for i in range(0, len(ids), _CHUNK_SIZE):
        chunk = ids[i : i + _CHUNK_SIZE]
        rows = await _execute(
            lambda: supabase.table("failed_matches")
            .select("match_id, attempts, gave_up")
            .in_("match_id", chunk)
        )
        existing.update((r["match_id"], (r["attempts"], r["gave_up"])) for r in rows)

    now = datetime.now(timezone.utc).isoformat()
    payload: list[dict[str, Any]] = []
    for match_id, error in latest.items():
        attempts, was_gave_up = existing.get(match_id, (0, False))
        attempts += 1
        payload.append(
            {
                "match_id": match_id,
                "attempts": attempts,
                "last_error": error[:_MAX_ERROR_LENGTH],
                "last_attempt_at": now,
                "gave_up": was_gave_up or attempts >= max_attempts,
            }
        )
    await _execute(
        lambda: supabase.table("failed_matches").upsert(payload, on_conflict="match_id")
    )
    return {row["match_id"] for row in payload if row["gave_up"]}


async def delete_failed_matches(match_ids: list[str]) -> None:
    """取得に成功した試合の失敗記録を削除する。記録がなくてもエラーにしない。"""
    for i in range(0, len(match_ids), _CHUNK_SIZE):
        chunk = match_ids[i : i + _CHUNK_SIZE]
        await _execute(
            lambda: supabase.table("failed_matches").delete().in_("match_id", chunk)
        )
