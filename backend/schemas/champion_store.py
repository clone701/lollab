"""champion_stats_store（DB）との入出力モデル。

フィールドは .kiro/specs/database/design.md のカラム定義に一致させる。
"""

from datetime import datetime

from pydantic import BaseModel


class StatsFilter(BaseModel):
    """集計対象の試合の絞り込み条件（期間・キュー）。

    リメイクの除外は条件に含めず、ストアが常に行う。
    """

    queue_ids: list[int]
    # 指定時は patch が一致する試合だけを対象にする（最新パッチ）
    patch: str | None = None
    # 指定時は game_end_at がこの日時以降の試合だけを対象にする（直近30日）
    since: datetime | None = None


class BuildRow(BaseModel):
    """ビルド集計に使う match_participants の1行（必要な列だけ）"""

    win: bool
    spell1_id: int
    spell2_id: int
    primary_style_id: int
    sub_style_id: int
    primary_perk_ids: list[int] | None = None
    sub_perk_ids: list[int] | None = None
    stat_perk_ids: list[int] | None = None
    skill_order: list[int] | None = None
    starting_items: list[int] | None = None
    completed_items: list[int] | None = None
