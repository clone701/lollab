"""crawler_seeds（クローラーの収集元プレイヤー）へのアクセス層。

Supabase クライアントは同期 API のため、query_runner 経由で呼び出す。
"""

from datetime import datetime
from typing import Any

from postgrest.types import CountMethod, ReturnMethod
from pydantic import TypeAdapter

from adapters.query_runner import execute as _execute
from adapters.query_runner import execute_count as _execute_count
from adapters.supabase import supabase
from schemas.crawler import CrawlerSeed, RankTier

_TABLE = "crawler_seeds"
_DATETIME = TypeAdapter(datetime)

# 1回の upsert で書き込む行数（リクエストの大きさを抑える）
_UPSERT_CHUNK_SIZE = 500


async def get_last_refreshed_at() -> datetime | None:
    """収集元を最後に更新した日時（refreshed_at の最大値）。1件もなければ None。"""
    rows = await _execute(
        lambda: supabase.table(_TABLE)
        .select("refreshed_at")
        .order("refreshed_at", desc=True)
        .limit(1)
    )
    return _DATETIME.validate_python(rows[0]["refreshed_at"]) if rows else None


async def upsert_seeds(seeds: list[CrawlerSeed], region: str) -> None:
    """収集元を puuid をキーに upsert する。last_crawled_at は書き込まない。

    last_crawled_at を含めると、更新のたびに収集の進み具合が消えてしまうため。
    """
    for i in range(0, len(seeds), _UPSERT_CHUNK_SIZE):
        rows: list[dict[str, Any]] = [
            {**s.model_dump(mode="json", exclude={"last_crawled_at"}), "region": region}
            for s in seeds[i : i + _UPSERT_CHUNK_SIZE]
        ]
        await _execute(
            lambda: supabase.table(_TABLE).upsert(
                rows, on_conflict="puuid", returning=ReturnMethod.minimal
            )
        )


async def delete_stale_seeds(older_than: datetime) -> int:
    """refreshed_at が older_than より前の行（降格・非アクティブ）を削除し、件数を返す。"""
    return await _execute_count(
        lambda: supabase.table(_TABLE)
        .delete(count=CountMethod.exact, returning=ReturnMethod.minimal)
        .lt("refreshed_at", older_than.isoformat())
    )


async def get_seeds_by_band(band: list[RankTier], limit: int) -> list[CrawlerSeed]:
    """band のランクの収集元を、last_crawled_at の古い順（NULL が先）に最大 limit 人返す。"""
    rows = await _execute(
        lambda: supabase.table(_TABLE)
        .select("puuid, tier, division, league_points, refreshed_at, last_crawled_at")
        .in_("tier", list(band))
        .order("last_crawled_at", desc=False, nullsfirst=True)
        .limit(limit)
    )
    return [CrawlerSeed.model_validate(row) for row in rows]


async def mark_crawled(puuid: str, at: datetime) -> None:
    """収集元の最後の収集日時を更新する。"""
    await _execute(
        lambda: supabase.table(_TABLE)
        .update({"last_crawled_at": at.isoformat()})
        .eq("puuid", puuid)
    )
