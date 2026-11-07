"""試合カード・チャンピオン統計のテスト用ヘルパー（参加記録と参加者の列の生成）。"""

from datetime import datetime, timedelta, timezone
from typing import Any

from schemas.summoner_store import MatchMemberRecord, ParticipationRecord


def participation(
    match_id: str = "JP1_1",
    puuid: str = "puuid-0",
    ended_ago: timedelta = timedelta(hours=1),
    **overrides: Any,
) -> ParticipationRecord:
    """ParticipationRecord を生成する（試合終了は現在から ended_ago 前）。"""
    fields: dict[str, Any] = {
        "match_id": match_id,
        "puuid": puuid,
        "team_id": 100,
        "team_position": "MIDDLE",
        "champion_id": 103,
        "champion_name": "Ahri",
        "win": True,
        "kills": 5,
        "deaths": 2,
        "assists": 8,
        "cs": 180,
        "gold_earned": 10000,
        "damage_to_champions": 20000,
        "vision_score": 20,
        "item_ids": [3157, 3089, 0, 0, 0, 0, 3363],
        "spell1_id": 4,
        "spell2_id": 14,
        "keystone_id": 8112,
        "primary_style_id": 8100,
        "sub_style_id": 8200,
        "queue_id": 420,
        "game_end_at": datetime.now(timezone.utc) - ended_ago,
        "game_mode": "CLASSIC",
        "game_duration": 1800,
    }
    fields.update(overrides)
    return ParticipationRecord.model_validate(fields)


def member(
    match_id: str = "JP1_1",
    puuid: str = "puuid-0",
    team_id: int = 100,
    team_position: str = "MIDDLE",
    kills: int = 0,
    **overrides: Any,
) -> MatchMemberRecord:
    """MatchMemberRecord を生成する。"""
    fields: dict[str, Any] = {
        "match_id": match_id,
        "puuid": puuid,
        "riot_id_game_name": f"Name-{puuid}",
        "riot_id_tagline": "JP1",
        "team_id": team_id,
        "team_position": team_position,
        "champion_name": f"Champ-{puuid}",
        "kills": kills,
    }
    fields.update(overrides)
    return MatchMemberRecord.model_validate(fields)
