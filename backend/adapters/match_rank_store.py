"""試合詳細に表示する参加者のランクの読み出し（summoners・crawler_seeds）。

試合時点ではなく、DB に今ある値を返す。Riot API は呼ばない。
"""

from typing import Any

from adapters.query_runner import execute as _execute
from adapters.supabase import supabase
from schemas.match_detail import RankBrief

# division を持たない（ディビジョンなしの）ティア
_APEX_TIERS = {"MASTER", "GRANDMASTER", "CHALLENGER"}


def _brief(tier: Any, division: Any) -> RankBrief | None:
    """tier が NULL・空・UNRANKED ならランクなし（None）。"""
    if not tier or tier == "UNRANKED":
        return None
    return RankBrief(
        tier=tier,
        division=None if tier in _APEX_TIERS else (division or None),
    )


async def get_ranks(puuids: list[str]) -> dict[str, RankBrief]:
    """PUUID ごとのランクを返す。summoners を優先し、なければ crawler_seeds。

    どちらにもない PUUID は結果に含めない。
    """
    if not puuids:
        return {}
    ranks: dict[str, RankBrief] = {}
    summoners = await _execute(
        lambda: supabase.table("summoners")
        .select("puuid, solo_tier, solo_rank")
        .in_("puuid", puuids)
    )
    for row in summoners:
        brief = _brief(row.get("solo_tier"), row.get("solo_rank"))
        if brief is not None:
            ranks.setdefault(row["puuid"], brief)

    missing = [p for p in puuids if p not in ranks]
    if not missing:
        return ranks
    seeds = await _execute(
        lambda: supabase.table("crawler_seeds")
        .select("puuid, tier, division")
        .in_("puuid", missing)
    )
    for row in seeds:
        brief = _brief(row.get("tier"), row.get("division"))
        if brief is not None:
            ranks.setdefault(row["puuid"], brief)
    return ranks
