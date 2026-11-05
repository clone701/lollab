"""summoner_rank_snapshots（ランクの記録）へのアクセス層。"""

from adapters.query_runner import execute as _execute
from adapters.supabase import supabase
from schemas.summoner_store import RankSnapshotRecord


async def get_latest_snapshot(puuid: str, queue_type: str) -> RankSnapshotRecord | None:
    """サモナーの指定キューの直近の記録を返す。なければ None。"""
    rows = await _execute(
        lambda: supabase.table("summoner_rank_snapshots")
        .select("*")
        .eq("puuid", puuid)
        .eq("queue_type", queue_type)
        .order("fetched_at", desc=True)
        .limit(1)
    )
    return RankSnapshotRecord.model_validate(rows[0]) if rows else None


async def insert_snapshot(record: RankSnapshotRecord) -> None:
    """ランクの記録を1件追加する。"""
    payload = record.model_dump(mode="json")
    await _execute(lambda: supabase.table("summoner_rank_snapshots").insert(payload))
