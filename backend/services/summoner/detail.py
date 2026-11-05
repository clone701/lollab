"""サモナー詳細の組み立て: Summoner_Store のデータから SummonerDetail を作る。"""

from datetime import datetime, timezone

from adapters import summoner_store
from schemas.summoner import (
    MatchData,
    RankData,
    RankPositionData,
    SummonerData,
    SummonerDetail,
)
from schemas.summoner_store import ParticipationRecord, SummonerRecord
from services.summoner.champion_stats import aggregate_champion_stats

# 試合履歴に含める最大件数
_RECENT_MATCH_LIMIT = 20

_SOLO_QUEUE = "RANKED_SOLO_5x5"


async def build_detail(record: SummonerRecord) -> SummonerDetail:
    """サモナーの保存済みデータから応答を組み立てる。Riot API は呼ばない。

    Args:
        record: summoners テーブルの行

    Returns:
        SummonerDetail: プロフィール・ランク順位・試合履歴・チャンピオン統計
    """
    now = datetime.now(timezone.utc)

    recent = await summoner_store.get_recent_participations(
        record.puuid, _RECENT_MATCH_LIMIT
    )
    matches = [_to_match_data(p, now) for p in recent]

    # 現行シーズンの期間で集計する。未登録なら全期間
    season = await summoner_store.get_current_season()
    start = season.start_at if season else None
    end = season.end_at if season else None
    season_participations = await summoner_store.get_participations_between(
        record.puuid, start, end
    )
    champion_stats = aggregate_champion_stats(
        [_to_match_data(p, now) for p in season_participations]
    )

    return SummonerDetail(
        summoner=_to_summoner_data(record),
        rankPosition=_to_rank_position(record),
        matches=matches,
        championStats=champion_stats,
    )


def _to_summoner_data(record: SummonerRecord) -> SummonerData:
    """summoners の行から SummonerData を作る。"""
    return SummonerData(
        name=record.game_name,
        tagLine=record.tag_line,
        level=record.level,
        profileIconId=record.profile_icon_id,
        rank=RankData(
            queueType=_SOLO_QUEUE,
            tier=record.solo_tier,
            rank=record.solo_rank,
            leaguePoints=record.solo_lp,
            wins=record.solo_wins,
            losses=record.solo_losses,
        ),
        lastUpdatedAt=record.last_updated_at,
    )


def _to_rank_position(record: SummonerRecord) -> RankPositionData | None:
    """ランク順位を組み立てる。UNRANKED または上位%が不明なら None。

    順位・人数が NULL の場合は、スキーマの規約に従い 0（不明）にする。
    """
    if record.solo_tier == "UNRANKED" or record.rank_top_percent is None:
        return None
    return RankPositionData(
        position=record.rank_position or 0,
        totalPlayers=record.rank_total or 0,
        topPercent=record.rank_top_percent,
    )


def _to_match_data(p: ParticipationRecord, now: datetime) -> MatchData:
    """参加記録を MatchData に変換する。timeAgoSeconds は now との差で求める。"""
    time_ago = int((now - p.game_end_at).total_seconds())
    return MatchData(
        matchId=p.match_id,
        isWin=p.win,
        gameMode=p.game_mode,
        championName=p.champion_name,
        kills=p.kills,
        deaths=p.deaths,
        assists=p.assists,
        cs=p.cs,
        gameDurationSeconds=p.game_duration,
        itemIds=p.item_ids,
        timeAgoSeconds=max(time_ago, 0),
    )
