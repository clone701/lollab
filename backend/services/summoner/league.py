"""league-v4 のレスポンスから、ソロランクとフレックスの勝敗数を取り出す。"""

from typing import Any

from schemas.riot_fetch import LeagueInfo
from schemas.summoner import RankData

SOLO_QUEUE = "RANKED_SOLO_5x5"
FLEX_QUEUE = "RANKED_FLEX_SR"


def parse_league(entries: list[dict[str, Any]]) -> LeagueInfo:
    """league-v4 のエントリを LeagueInfo にする。

    ソロランクのエントリがなければ UNRANKED（勝敗数 0）、
    フレックスのエントリがなければ勝敗数 0 とする。
    """
    solo = RankData(
        queueType=SOLO_QUEUE,
        tier="UNRANKED",
        rank="",
        leaguePoints=0,
        wins=0,
        losses=0,
    )
    solo_summoner_id = ""
    flex: dict[str, Any] = {
        "tier": "UNRANKED",
        "rank": "",
        "leaguePoints": 0,
        "wins": 0,
        "losses": 0,
    }
    for entry in entries:
        queue = entry.get("queueType")
        if queue == SOLO_QUEUE:
            solo = RankData(
                queueType=SOLO_QUEUE,
                tier=entry["tier"],
                rank=entry["rank"],
                leaguePoints=entry["leaguePoints"],
                wins=entry["wins"],
                losses=entry["losses"],
            )
            solo_summoner_id = entry.get("summonerId", "")
        elif queue == FLEX_QUEUE:
            flex = {key: entry.get(key, value) for key, value in flex.items()}
    return LeagueInfo(
        solo=solo,
        solo_summoner_id=solo_summoner_id,
        flex_wins=flex["wins"],
        flex_losses=flex["losses"],
        flex_tier=flex["tier"],
        flex_rank=flex["rank"],
        flex_lp=flex["leaguePoints"],
    )
