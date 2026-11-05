"""match-v5 の試合詳細レスポンスを保存用レコードに変換する。"""

from datetime import datetime, timezone
from typing import Any

from schemas.riot_fetch import FetchedMatch
from schemas.summoner_store import (
    DETAIL_VERSION,
    BanRecord,
    MatchRecord,
    ParticipantRecord,
)

# ルーンの構成数（メイン4つ・サブ2つ）
_PRIMARY_PERK_COUNT = 4
_SUB_PERK_COUNT = 2

# BAN なしを表すチャンピオンID（保存しない）
_NO_BAN = -1


def convert_match(detail: dict[str, Any]) -> FetchedMatch:
    """試合詳細を MatchRecord 1件、ParticipantRecord（参加者数分）、BanRecord に変換する。

    Args:
        detail: match-v5 `/lol/match/v5/matches/{matchId}` のレスポンス

    Returns:
        FetchedMatch: 変換結果（detail_version = 2）

    Raises:
        KeyError, IndexError, TypeError: レスポンスの形式が想定と異なる場合
    """
    info = detail["info"]
    match_id: str = detail["metadata"]["matchId"]
    game_end_at, game_duration = _end_and_duration(info)
    queue_id: int = info["queueId"]
    patch = _patch_of(info["gameVersion"])
    is_remake = any(p.get("gameEndedInEarlySurrender") for p in info["participants"])

    match = MatchRecord(
        match_id=match_id,
        queue_id=queue_id,
        game_mode=info["gameMode"],
        game_version=info["gameVersion"],
        game_duration=game_duration,
        game_end_at=game_end_at,
        patch=patch,
        is_remake=is_remake,
        detail_version=DETAIL_VERSION,
    )
    participants = [
        _convert_participant(p, match, patch, is_remake) for p in info["participants"]
    ]
    return FetchedMatch(
        match=match, participants=participants, bans=_convert_bans(match_id, info)
    )


def patch_of_detail(detail: dict[str, Any]) -> str | None:
    """試合詳細のパッチ（gameVersion の先頭2要素）を返す。"""
    return _patch_of(detail["info"]["gameVersion"])


def _patch_of(game_version: str) -> str | None:
    """gameVersion の先頭2要素（"16.22.123.4" → "16.22"）。2要素に満たなければ None。"""
    parts = game_version.split(".")
    return ".".join(parts[:2]) if len(parts) >= 2 else None


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


def _convert_bans(match_id: str, info: dict[str, Any]) -> list[BanRecord]:
    """両チームの BAN を BanRecord にする（BAN なしの -1 は除く）。"""
    return [
        BanRecord(
            match_id=match_id,
            team_id=team["teamId"],
            pick_turn=ban["pickTurn"],
            champion_id=ban["championId"],
        )
        for team in info["teams"]
        for ban in team["bans"]
        if ban["championId"] != _NO_BAN
    ]


def _convert_participant(
    p: dict[str, Any], match: MatchRecord, patch: str | None, is_remake: bool
) -> ParticipantRecord:
    """参加者1人分のレスポンスを ParticipantRecord に変換する。"""
    styles = p["perks"]["styles"]
    primary = [s["perk"] for s in styles[0]["selections"]][:_PRIMARY_PERK_COUNT]
    sub = [s["perk"] for s in styles[1]["selections"]][:_SUB_PERK_COUNT]
    shards = p["perks"]["statPerks"]
    return ParticipantRecord(
        match_id=match.match_id,
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
        keystone_id=primary[0],
        primary_style_id=styles[0]["style"],
        sub_style_id=styles[1]["style"],
        primary_perk_ids=primary,
        sub_perk_ids=sub,
        stat_perk_ids=[shards["offense"], shards["flex"], shards["defense"]],
        queue_id=match.queue_id,
        game_end_at=match.game_end_at,
        patch=patch,
        is_remake=is_remake,
    )
