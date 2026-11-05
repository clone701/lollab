"""チャンピオンビルド API の入出力モデル。

フィールドは .kiro/specs/champion-stats/design.md のスキーマに一致させる。
"""

from typing import Literal

from pydantic import BaseModel

Role = Literal["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"]
Period = Literal["latest_patch", "last_30_days", "all"]
QueueFilter = Literal["all", "solo", "flex"]


class BuildOption(BaseModel):
    """ビルド要素の選択肢1つ分の集計"""

    # 要素ごとのキー（スキルは 1〜4、アイテム・ルーン・スペルは ID）
    key: list[int]
    games: int
    wins: int


class BuildElement(BaseModel):
    """ビルド要素1つ分（スキル優先順など）の集計"""

    # この要素の集計対象の行数
    games: int
    # 試合数の多い順、最大10件
    options: list[BuildOption]
    # 全選択肢のうち勝率が最も高い1件（同率は試合数の多い方）
    best_win_rate: BuildOption | None = None


class ChampionBuildSummary(BaseModel):
    """概要の値。win_rate_delta・pick_rate・ban_rate は 0〜1 の比率"""

    games: int
    wins: int
    win_rate_delta: float
    pick_rate: float
    ban_rate: float


class ChampionBuildResponse(BaseModel):
    """GET /api/champion/{championName}/build の応答"""

    champion_name: str
    # 試合が0件でロール省略の場合は None
    role: str | None
    # ロール別の試合数（ロール切り替え用）
    roles: dict[str, int]
    period: str
    queue: str
    latest_patch: str | None
    summary: ChampionBuildSummary
    skill_priority: BuildElement
    skill_order: BuildElement
    spells: BuildElement
    starting_items: BuildElement
    core_items: BuildElement
    item4: BuildElement
    item5: BuildElement
    item6: BuildElement
    # key = [primary_style, p1, p2, p3, p4, sub_style, s1, s2, shard1, shard2, shard3]
    runes: BuildElement
