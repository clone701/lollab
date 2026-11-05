"""補完対象の試合（matches）の抽出。

summoner_store.py の行数を抑えるため、別モジュールに分けている。
"""

from datetime import datetime
from typing import Any

from pydantic import TypeAdapter

from adapters.query_runner import execute as _execute
from adapters.supabase import supabase
from schemas.summoner_store import DETAIL_VERSION, EnrichTarget

_DATETIME = TypeAdapter(datetime)


async def get_enrichment_targets(
    after: datetime | None, limit: int
) -> list[EnrichTarget]:
    """補完対象の試合を game_end_at の古い順に最大 limit 件返す。

    対象は、detail_version が DETAIL_VERSION 未満、またはタイムライン未取得の試合。
    after を指定すると、game_end_at が after 以上の試合だけを返す（境界を含む。
    同じ日時の試合を取りこぼさないため）。
    """

    def _query() -> Any:
        query = (
            supabase.table("matches")
            .select("match_id, game_end_at, detail_version, timeline_fetched_at")
            .or_(f"detail_version.lt.{DETAIL_VERSION},timeline_fetched_at.is.null")
        )
        if after is not None:
            query = query.gte("game_end_at", after.isoformat())
        return query.order("game_end_at").order("match_id").limit(limit)

    rows = await _execute(_query)
    return [
        EnrichTarget(
            match_id=row["match_id"],
            game_end_at=_DATETIME.validate_python(row["game_end_at"]),
            needs_detail=row["detail_version"] < DETAIL_VERSION,
            needs_timeline=row["timeline_fetched_at"] is None,
        )
        for row in rows
    ]
