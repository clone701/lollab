"""チャンピオンビルドAPIルーター: HTTPリクエストのバリデーションとルーティングを担当する。"""

import logging
from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, Query

from schemas.champion import ChampionBuildResponse, Period, QueueFilter, Role
from services.champion.build import get_champion_build

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/champion")


@router.get("/{championName}/build")
async def get_build(
    championName: Annotated[
        str, Path(min_length=1, max_length=30, pattern=r"^[A-Za-z0-9]+$")
    ],
    role: Annotated[Role | None, Query()] = None,
    period: Annotated[Period, Query()] = "latest_patch",
    queue: Annotated[QueueFilter, Query()] = "all",
) -> ChampionBuildResponse:
    """チャンピオンのロール別ビルド（選択肢ごとの試合数・勝利数）を返す。

    Args:
        championName: Data Dragon の ID（例: LeeSin）。英数字1〜30文字
        role: TOP / JUNGLE / MIDDLE / BOTTOM / UTILITY。省略時は試合数が最も多いロール
        period: latest_patch（既定）/ last_30_days / all
        queue: all（既定）/ solo / flex

    Raises:
        HTTPException: 422（入力不正。FastAPI が返す）、500（サーバーエラー）
    """
    try:
        return await get_champion_build(championName, role, period, queue)
    except Exception:
        # DB 例外などの詳細はログにだけ残し、応答には含めない
        logger.error(
            "チャンピオンビルド API で予期しないエラーが発生しました", exc_info=True
        )
        raise HTTPException(
            status_code=500, detail="サーバーエラーが発生しました"
        ) from None
