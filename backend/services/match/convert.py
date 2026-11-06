"""試合詳細の生データから、成績とチームの結果を組み立てる（純粋関数）。"""

from typing import Any

from schemas.match_detail import (
    MatchDetailResponse,
    ParticipantBuild,
    ParticipantDetail,
    RankBrief,
    TeamDetail,
)
from services.summoner.match_convert import convert_match

# ルーンの構成数（メイン4つ・サブ2つ）
_PRIMARY_PERK_COUNT = 4
_SUB_PERK_COUNT = 2

# 参加者の並び順（空・未知のポジションは最後）
_POSITIONS = ("TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY")

# TeamDetail.objectives のキーと、Riot API の objectives のキー
_OBJECTIVES = {
    "baron": "baron",
    "dragon": "dragon",
    "rift_herald": "riftHerald",
    "horde": "horde",
    "atakhan": "atakhan",
    "tower": "tower",
    "inhibitor": "inhibitor",
}


def _position_order(position: str) -> int:
    return _POSITIONS.index(position) if position in _POSITIONS else len(_POSITIONS)


def kill_participation(kills: int, assists: int, team_kills: int) -> float:
    """キル関与率（0〜1）。チームの合計キルが0なら0。"""
    if team_kills <= 0:
        return 0.0
    return (kills + assists) / team_kills


def _team_kills(participants: list[dict[str, Any]]) -> dict[int, int]:
    totals: dict[int, int] = {}
    for p in participants:
        totals[p["teamId"]] = totals.get(p["teamId"], 0) + p["kills"]
    return totals


def _participant(
    p: dict[str, Any],
    team_kills: int,
    rank: RankBrief | None,
    build: ParticipantBuild | None,
) -> ParticipantDetail:
    """参加者1人分のレスポンスを ParticipantDetail にする。"""
    styles = p["perks"]["styles"]
    shards = p["perks"]["statPerks"]
    return ParticipantDetail(
        puuid=p["puuid"],
        riot_id_game_name=p.get("riotIdGameName") or None,
        riot_id_tagline=p.get("riotIdTagline") or None,
        team_id=p["teamId"],
        team_position=p.get("teamPosition") or "",
        champion_name=p["championName"],
        champ_level=p["champLevel"],
        spell_ids=[p["summoner1Id"], p["summoner2Id"]],
        primary_style_id=styles[0]["style"],
        sub_style_id=styles[1]["style"],
        primary_perk_ids=[s["perk"] for s in styles[0]["selections"]][
            :_PRIMARY_PERK_COUNT
        ],
        sub_perk_ids=[s["perk"] for s in styles[1]["selections"]][:_SUB_PERK_COUNT],
        stat_perk_ids=[shards["offense"], shards["flex"], shards["defense"]],
        kills=p["kills"],
        deaths=p["deaths"],
        assists=p["assists"],
        kill_participation=kill_participation(p["kills"], p["assists"], team_kills),
        damage_to_champions=p["totalDamageDealtToChampions"],
        damage_taken=p["totalDamageTaken"],
        wards_placed=p["wardsPlaced"],
        wards_killed=p["wardsKilled"],
        cs=p["totalMinionsKilled"] + p["neutralMinionsKilled"],
        gold_earned=p["goldEarned"],
        item_ids=[p[f"item{i}"] for i in range(7)],
        rank=rank,
        build=build,
    )


def _team(team: dict[str, Any], participants: list[dict[str, Any]]) -> TeamDetail:
    """チームの結果。合計キル・合計ゴールドは参加者の合計。"""
    members = [p for p in participants if p["teamId"] == team["teamId"]]
    objectives = team.get("objectives") or {}
    return TeamDetail(
        team_id=team["teamId"],
        win=team["win"],
        kills=sum(p["kills"] for p in members),
        gold=sum(p["goldEarned"] for p in members),
        objectives={
            key: (objectives.get(source) or {}).get("kills", 0)
            for key, source in _OBJECTIVES.items()
        },
    )


def build_match_detail(
    detail: dict[str, Any],
    ranks: dict[str, RankBrief],
    builds: dict[str, ParticipantBuild] | None,
) -> MatchDetailResponse:
    """試合詳細の生データから応答を組み立てる。

    Args:
        detail: match-v5 `/lol/match/v5/matches/{matchId}` のレスポンス
        ranks: {puuid: ランク}（ないプレイヤーは含めない）
        builds: {puuid: ビルド}。タイムラインがなければ None

    Returns:
        参加者はチームID・team_position の順に並べた MatchDetailResponse

    Raises:
        KeyError, IndexError, TypeError, ValueError: レスポンスの形式が想定と異なる場合
    """
    info = detail["info"]
    raw_participants: list[dict[str, Any]] = info["participants"]
    record = convert_match(detail).match
    kills = _team_kills(raw_participants)

    participants = [
        _participant(
            p,
            kills[p["teamId"]],
            ranks.get(p["puuid"]),
            builds.get(p["puuid"]) if builds is not None else None,
        )
        for p in raw_participants
    ]
    participants.sort(key=lambda p: (p.team_id, _position_order(p.team_position)))
    teams = sorted(
        (_team(t, raw_participants) for t in info["teams"]), key=lambda t: t.team_id
    )
    return MatchDetailResponse(
        match_id=record.match_id,
        queue_id=record.queue_id,
        game_duration=record.game_duration,
        game_end_at=record.game_end_at,
        teams=teams,
        participants=participants,
    )
