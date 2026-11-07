"""試合カード（MatchData）の組み立て。保存済みの試合データだけを使い、Riot API は呼ばない。"""

import asyncio
from datetime import datetime

from adapters import match_member_store, match_rank_store
from schemas.match_detail import RankBrief
from schemas.summoner import MatchData, MatchParticipantBrief
from schemas.summoner_store import MatchMemberRecord, ParticipationRecord
from services.match.convert import kill_participation
from services.summoner.rank_average import average_rank

# 参加者の並び順（空・未知のポジションは最後）
_POSITIONS = ("TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY")

# ランクを一度に問い合わせる PUUID の数（URL が長くなりすぎないようにする）
_RANK_CHUNK_SIZE = 50


async def build_match_cards(
    recent: list[ParticipationRecord], now: datetime
) -> list[MatchData]:
    """直近の参加記録から、試合カードの表示項目を組み立てる。

    Args:
        recent: 新しい順の参加記録（検索したサモナー自身の分）
        now: timeAgoSeconds の基準時刻

    Returns:
        recent と同じ順の MatchData
    """
    if not recent:
        return []
    members = await match_member_store.get_members_by_match(
        [p.match_id for p in recent]
    )
    ranks = await _get_ranks(
        sorted({m.puuid for group in members.values() for m in group})
    )
    return [
        _to_match_data(p, _sorted_members(members.get(p.match_id, [])), ranks, now)
        for p in recent
    ]


async def _get_ranks(puuids: list[str]) -> dict[str, RankBrief]:
    """PUUID ごとのランク。件数が多いので _RANK_CHUNK_SIZE 件ずつ問い合わせる。"""
    chunks = [
        puuids[i : i + _RANK_CHUNK_SIZE]
        for i in range(0, len(puuids), _RANK_CHUNK_SIZE)
    ]
    ranks: dict[str, RankBrief] = {}
    for found in await asyncio.gather(*(match_rank_store.get_ranks(c) for c in chunks)):
        ranks.update(found)
    return ranks


def _position_order(position: str) -> int:
    return _POSITIONS.index(position) if position in _POSITIONS else len(_POSITIONS)


def _sorted_members(members: list[MatchMemberRecord]) -> list[MatchMemberRecord]:
    """チームID → ポジション（TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY、空は最後）の順に並べる。"""
    return sorted(
        members,
        key=lambda m: (m.team_id, _position_order(m.team_position), m.puuid),
    )


def _to_match_data(
    p: ParticipationRecord,
    members: list[MatchMemberRecord],
    ranks: dict[str, RankBrief],
    now: datetime,
) -> MatchData:
    """参加記録を MatchData に変換する。timeAgoSeconds は now との差で求める。"""
    team_kills = sum(m.kills for m in members if m.team_id == p.team_id)
    time_ago = int((now - p.game_end_at).total_seconds())
    return MatchData(
        matchId=p.match_id,
        isWin=p.win,
        isRemake=p.is_remake,
        gameMode=p.game_mode,
        queueId=p.queue_id,
        championName=p.champion_name,
        kills=p.kills,
        deaths=p.deaths,
        assists=p.assists,
        killParticipation=kill_participation(p.kills, p.assists, team_kills),
        cs=p.cs,
        gameDurationSeconds=p.game_duration,
        itemIds=p.item_ids,
        spellIds=[p.spell1_id, p.spell2_id],
        keystoneId=p.keystone_id,
        subStyleId=p.sub_style_id,
        participants=[_brief(m) for m in members],
        averageRank=average_rank([ranks[m.puuid] for m in members if m.puuid in ranks]),
        timeAgoSeconds=max(time_ago, 0),
    )


def _brief(m: MatchMemberRecord) -> MatchParticipantBrief:
    return MatchParticipantBrief(
        puuid=m.puuid,
        teamId=m.team_id,
        championName=m.champion_name,
        riotIdGameName=m.riot_id_game_name or None,
        riotIdTagline=m.riot_id_tagline or None,
    )
