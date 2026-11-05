"""チャンピオン統計サービス: 試合リストからチャンピオン別統計を集計する。"""

from collections import defaultdict

from schemas.summoner import ChampionStatData, MatchData


def aggregate_champion_stats(matches: list[MatchData]) -> list[ChampionStatData]:
    """試合リストからチャンピオン別統計を集計する。

    Args:
        matches: 試合データのリスト

    Returns:
        list[ChampionStatData]: チャンピオン別統計リスト（総試合数降順）
    """
    if not matches:
        return []

    # チャンピオン名をキーに集計用データを蓄積
    stats: dict[str, dict] = defaultdict(
        lambda: {
            "wins": 0,
            "losses": 0,
            "total_cs": 0,
            "total_kills": 0,
            "total_deaths": 0,
            "total_assists": 0,
            "games": 0,
        }
    )

    for match in matches:
        s = stats[match.championName]
        if match.isWin:
            s["wins"] += 1
        else:
            s["losses"] += 1
        s["total_cs"] += match.cs
        s["total_kills"] += match.kills
        s["total_deaths"] += match.deaths
        s["total_assists"] += match.assists
        s["games"] += 1

    result: list[ChampionStatData] = []
    for champion_name, s in stats.items():
        games = s["games"]
        avg_cs = s["total_cs"] / games
        kda = (s["total_kills"] + s["total_assists"]) / max(s["total_deaths"], 1)
        result.append(
            ChampionStatData(
                championName=champion_name,
                wins=s["wins"],
                losses=s["losses"],
                cs=avg_cs,
                kda=kda,
            )
        )

    # 総試合数（wins + losses）降順でソート
    result.sort(key=lambda x: x.wins + x.losses, reverse=True)
    return result
