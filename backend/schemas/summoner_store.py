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


# 試合詳細から取り込んだ項目の版。2 = ルーン全構成・シャード・BAN を含む
DETAIL_VERSION = 2


class MatchRecord(BaseModel):
    """matches テーブルの1行

    timeline_fetched_at が None のときは、保存時にその列を書き込まない
    （詳細の取り直しで、取り込み済みのタイムラインの記録を消さないため）。
    rank_tier（クローラーが付けるランク帯）と raw_bundle_key（クローラーの
    生データのまとめファイルのキー）も同じ扱い。
    """

    match_id: str
    queue_id: int
    game_mode: str
    game_version: str
    game_duration: int
    game_end_at: datetime
    patch: str | None = None
    is_remake: bool = False
    detail_version: int = 1
    timeline_fetched_at: datetime | None = None
    rank_tier: str | None = None
    raw_bundle_key: str | None = None
    created_at: datetime | None = None


class BanRecord(BaseModel):
    """match_bans テーブルの1行（BAN なしの -1 は保存しない）"""

    match_id: str
    team_id: int
    pick_turn: int
    champion_id: int


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
    primary_perk_ids: list[int] | None = None
    sub_perk_ids: list[int] | None = None
    stat_perk_ids: list[int] | None = None
    # タイムライン由来。skill_order が None のときは3列とも書き込まない
    skill_order: list[int] | None = None
    starting_items: list[int] | None = None
    completed_items: list[int] | None = None
    queue_id: int
    game_end_at: datetime
    patch: str | None = None
    is_remake: bool = False
    # クローラーが付けるランク帯。None のときは書き込まない（既存の値を消さない）
    rank_tier: str | None = None


class ParticipationRecord(ParticipantRecord):
    """試合一覧・統計用の読み出しモデル。

    match_participants の行に matches の game_mode / game_duration を加えたもの。
    """

    game_mode: str
    game_duration: int


class EnrichTarget(BaseModel):
    """補完対象の試合（matches の1行から求める）"""

    match_id: str
    game_end_at: datetime
    needs_detail: bool
    needs_timeline: bool


class RankSnapshotRecord(BaseModel):
    """summoner_rank_snapshots テーブルの1行"""

    puuid: str
    queue_type: str
    fetched_at: datetime
    region: str
    tier: str
    rank: str
    league_points: int
    wins: int
    losses: int
    source: str


class SeasonRecord(BaseModel):
    """seasons テーブルの1行"""

    id: str
    name: str
    start_at: datetime
    end_at: datetime | None = None
