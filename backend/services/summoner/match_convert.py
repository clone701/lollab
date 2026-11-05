"""match-v5 の試合詳細レスポンスを保存用レコードに変換する。"""

from datetime import datetime, timezone
from typing import Any

from schemas.riot_fetch import FetchedMatch
from schemas.summoner_store import MatchRecord, ParticipantRecord


def convert_match(detail: dict[str, Any]) -> FetchedMatch:
    """試合詳細を MatchRecord 1件と ParticipantRecord（参加者数分）に変換する。

    Args:
        detail: match-v5 `/lol/match/v5/matches/{matchId}` のレスポンス

    Returns:
        FetchedMatch: 変換結果

    Raises:
        KeyError, IndexError, TypeError: レスポンスの形式が想定と異なる場合
    """
    info = detail["info"]
    match_id: str = detail["metadata"]["matchId"]
    game_end_at, game_duration = _end_and_duration(info)
    queue_id: int = info["queueId"]

    match = MatchRecord(
        match_id=match_id,
        queue_id=queue_id,
        game_mode=info["gameMode"],
        game_version=info["gameVersion"],
        game_duration=game_duration,
        game_end_at=game_end_at,
    )
    participants = [
        _convert_participant(p, match_id, queue_id, game_end_at)
        for p in info["participants"]
    ]
    return FetchedMatch(match=match, participants=participants)


def _end_and_duration(info: dict[str, Any]) -> tuple[datetime, int]:
    """試合の終了日時（UTC）と試合時間（秒）を求める。

    パッチ11.20より前の試合は gameEndTimestamp がなく、gameDuration がミリ秒。
    その場合、終了日時は gameStartTimestamp + gameDuration、試合時間は
    gameDuration // 1000 とする。
    """
    if "gameEndTimestamp" in info:
        end_ms: int = info["gameEndTimestamp"]
        return (
            datetime.fromtimestamp(end_ms / 1000, tz=timezone.utc),
            info["gameDuration"],
        )
    duration_ms: int = info["gameDuration"]
    end_ms = info["gameStartTimestamp"] + duration_ms
    return datetime.fromtimestamp(end_ms / 1000, tz=timezone.utc), duration_ms // 1000


def _convert_participant(
    p: dict[str, Any], match_id: str, queue_id: int, game_end_at: datetime
) -> ParticipantRecord:
    """参加者1人分のレスポンスを ParticipantRecord に変換する。"""
    styles = p["perks"]["styles"]
    return ParticipantRecord(
        match_id=match_id,
        puuid=p["puuid"],
        riot_id_game_name=p.get("riotIdGameName"),
        riot_id_tagline=p.get("riotIdTagline"),
        team_id=p["teamId"],
        team_position=p.get("teamPosition") or "",
        champion_id=p["championId"],
        champion_name=p["championName"],
        win=p["win"],
        kills=p["kills"],
        deaths=p["deaths"],
        assists=p["assists"],
        cs=p["totalMinionsKilled"] + p["neutralMinionsKilled"],
        gold_earned=p["goldEarned"],
        damage_to_champions=p["totalDamageDealtToChampions"],
        vision_score=p["visionScore"],
        item_ids=[p[f"item{i}"] for i in range(7)],
        spell1_id=p["summoner1Id"],
        spell2_id=p["summoner2Id"],
        keystone_id=styles[0]["selections"][0]["perk"],
        primary_style_id=styles[0]["style"],
        sub_style_id=styles[1]["style"],
        queue_id=queue_id,
        game_end_at=game_end_at,
    )
