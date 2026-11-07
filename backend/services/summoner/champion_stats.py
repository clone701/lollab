"""チャンピオン統計サービス: 試合リストからチャンピオン別統計を集計する。"""

from collections import defaultdict

from schemas.summoner import ChampionStatData, ChampionStatsByQueue
from schemas.summoner_store import ParticipationRecord

# ランク戦のキュー ID
SOLO_QUEUE_ID = 420
FLEX_QUEUE_ID = 440


def aggregate_champion_stats_by_queue(
    matches: list[ParticipationRecord],
) -> ChampionStatsByQueue:
    """試合リストをキューごと（全体・ソロ・フレックス）に集計する。

    全体はソロとフレックスの両方。それ以外のキューの試合とリメイクの試合はどれにも含めない。

    Args:
        matches: 参加記録のリスト

    Returns:
        ChampionStatsByQueue: キューごとのチャンピオン別統計（総試合数降順）
    """
    # リメイク（早期降伏）の試合は成績に含めない
    counted = [m for m in matches if not m.is_remake]
    solo = [m for m in counted if m.queue_id == SOLO_QUEUE_ID]
    flex = [m for m in counted if m.queue_id == FLEX_QUEUE_ID]
    return ChampionStatsByQueue(
        all=aggregate_champion_stats(solo + flex),
        solo=aggregate_champion_stats(solo),
        flex=aggregate_champion_stats(flex),
    )


def aggregate_champion_stats(
    matches: list[ParticipationRecord],
) -> list[ChampionStatData]:
    """試合リストからチャンピオン別統計を集計する。

    Args:
        matches: 参加記録のリスト

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
            "total_duration_seconds": 0,
            "games": 0,
        }
    )

    for match in matches:
        s = stats[match.champion_name]
        if match.win:
            s["wins"] += 1
        else:
            s["losses"] += 1
        s["total_cs"] += match.cs
        s["total_kills"] += match.kills
        s["total_deaths"] += match.deaths
        s["total_assists"] += match.assists
        s["total_duration_seconds"] += match.game_duration
        s["games"] += 1

    result: list[ChampionStatData] = []
    for champion_name, s in stats.items():
        games = s["games"]
        avg_cs = s["total_cs"] / games
        # 分あたり CS: CS の合計 / 試合時間（分）の合計。時間が 0 なら 0
        total_minutes = s["total_duration_seconds"] / 60
        cs_per_minute = s["total_cs"] / total_minutes if total_minutes > 0 else 0.0
        kda = (s["total_kills"] + s["total_assists"]) / max(s["total_deaths"], 1)
        result.append(
            ChampionStatData(
                championName=champion_name,
                wins=s["wins"],
                losses=s["losses"],
                cs=avg_cs,
                csPerMinute=cs_per_minute,
                kills=s["total_kills"] / games,
                deaths=s["total_deaths"] / games,
                assists=s["total_assists"] / games,
                kda=kda,
            )
        )

    # 総試合数（wins + losses）降順でソート
    result.sort(key=lambda x: x.wins + x.losses, reverse=True)
    return result
