"""Summoner_Store（DB）との入出力モデル。

フィールドは .kiro/specs/database/design.md のカラム定義に一致させる。
"""

from datetime import datetime

from pydantic import BaseModel


class BackfillState(BaseModel):
    """Backfill の取得済み範囲（summoners のカーソル3カラム）"""

    synced_until: datetime | None = None
    backfill_cursor: datetime | None = None
    backfill_completed: bool = False


class SummonerRecord(BaseModel):
    """summoners テーブルの1行

    created_at と backfill_started_at は DB 側で管理する。
    """

    puuid: str
    region: str
    game_name: str
    tag_line: str
    riot_id_lower: str
    level: int
    profile_icon_id: int
    solo_tier: str
    solo_rank: str
    solo_lp: int
    solo_wins: int
    solo_losses: int
    flex_wins: int = 0
    flex_losses: int = 0
    rank_position: int | None = None
    rank_total: int | None = None
    rank_top_percent: float | None = None
    last_updated_at: datetime
    synced_until: datetime | None = None
    backfill_cursor: datetime | None = None
    backfill_completed: bool = False
    backfill_started_at: datetime | None = None
    created_at: datetime | None = None


class MatchRecord(BaseModel):
    """matches テーブルの1行"""

    match_id: str
    queue_id: int
    game_mode: str
    game_version: str
    game_duration: int
    game_end_at: datetime
    created_at: datetime | None = None


class ParticipantRecord(BaseModel):
    """match_participants テーブルの1行"""

    match_id: str
    puuid: str
    riot_id_game_name: str | None = None
    riot_id_tagline: str | None = None
    team_id: int
    team_position: str
    champion_id: int
    champion_name: str
    win: bool
    kills: int
    deaths: int
    assists: int
    cs: int
    gold_earned: int
    damage_to_champions: int
    vision_score: int
    item_ids: list[int]
    spell1_id: int
    spell2_id: int
    keystone_id: int
    primary_style_id: int
    sub_style_id: int
    queue_id: int
    game_end_at: datetime


class ParticipationRecord(ParticipantRecord):
    """試合一覧・統計用の読み出しモデル。

    match_participants の行に matches の game_mode / game_duration を加えたもの。
    """

    game_mode: str
    game_duration: int


class SeasonRecord(BaseModel):
    """seasons テーブルの1行"""

    id: str
    name: str
    start_at: datetime
    end_at: datetime | None = None
