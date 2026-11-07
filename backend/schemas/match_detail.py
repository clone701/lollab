"""試合詳細 API（GET /api/match/{matchId}）の応答モデル。

フィールドは .kiro/specs/match-detail/design.md の「スキーマ」に一致させる。
"""

from datetime import datetime

from pydantic import BaseModel


class RankBrief(BaseModel):
    """参加者のランク（今わかっているもの。試合時点ではない）"""

    tier: str  # EMERALD など
    division: str | None  # マスター以上は None


class ItemPurchaseGroup(BaseModel):
    """同じ分に購入したアイテム"""

    minute: int
    item_ids: list[int]  # 購入順


class ParticipantBuild(BaseModel):
    """参加者のビルド（タイムライン由来）"""

    item_purchases: list[ItemPurchaseGroup]
    skill_order: list[int]  # 1=Q, 2=W, 3=E, 4=R
    skill_priority: list[int]  # 最大化の順（例: [1, 2, 3]）


class ParticipantDetail(BaseModel):
    """参加者1人分の成績とビルド"""

    puuid: str
    riot_id_game_name: str | None
    riot_id_tagline: str | None
    team_id: int
    team_position: str
    champion_name: str
    champ_level: int
    spell_ids: list[int]  # [spell1, spell2]
    primary_style_id: int
    sub_style_id: int
    primary_perk_ids: list[int]  # キーストーン含む4つ
    sub_perk_ids: list[int]
    stat_perk_ids: list[int]  # offense, flex, defense
    kills: int
    deaths: int
    assists: int
    kill_participation: float  # 0〜1
    damage_to_champions: int
    damage_taken: int
    wards_placed: int
    wards_killed: int
    control_wards_bought: int  # コントロールワードの購入数
    cs: int
    gold_earned: int
    item_ids: list[int]  # item0〜6（0 は空き）
    rank: RankBrief | None
    build: ParticipantBuild | None  # タイムラインがない場合は None


class TeamDetail(BaseModel):
    """チーム1つ分の結果"""

    team_id: int  # 100 = ブルー、200 = レッド
    win: bool
    kills: int
    gold: int
    # baron, dragon, rift_herald, horde, atakhan, tower, inhibitor
    objectives: dict[str, int]


class MatchDetailResponse(BaseModel):
    """試合詳細 API の応答"""

    match_id: str
    queue_id: int
    game_duration: int  # 秒
    game_end_at: datetime
    teams: list[TeamDetail]
    # チームごと・team_position の順（TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY）
    participants: list[ParticipantDetail]
