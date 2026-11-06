"""クローラー（match-crawler）のモデル。

フィールドは .kiro/specs/match-crawler/design.md と、database Spec の
crawler_seeds のカラム定義に一致させる。
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

RankTier = Literal["EMERALD", "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER"]
StopReason = Literal[
    "completed", "deadline", "rate_limited", "too_many_failures", "no_seeds"
]


class CrawlerSeed(BaseModel):
    """crawler_seeds テーブルの1行（収集元プレイヤー。region は保存時に付ける）"""

    puuid: str
    tier: RankTier
    division: str | None = None  # マスター以上は None
    league_points: int
    refreshed_at: datetime
    last_crawled_at: datetime | None = None


class CollectResult(BaseModel):
    """収集元プレイヤー1人分の収集結果

    collect_seed に渡して使う累積用のモデルでもある（429 で中断しても、
    それまでに保存した件数を呼び出し側が読める）。
    """

    matches_saved: int = 0
    matches_failed: int = 0
    # 試合ID一覧の取得に失敗し、この収集元を飛ばした
    seed_failed: bool = False
    # 最後まで処理できて、収集日時を更新した
    completed: bool = False


class CrawlResult(BaseModel):
    """1回の起動の結果（ログに1行の JSON で出す。PUUID は含めない）"""

    stop_reason: StopReason
    seeds_crawled: int = 0
    matches_saved: int = 0
    matches_failed: int = 0
    matches_pruned: int = 0
    riot_requests: int = 0
