"""試合詳細 API ルーター: HTTPリクエストのバリデーションとルーティングを担当する。"""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Response

from api.deps.auth import require_allowed_user
from schemas.match_detail import MatchDetailResponse
from services.match.detail import get_match_detail

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/match", dependencies=[Depends(require_allowed_user)])

# 同じ試合の応答は変わらないため、ブラウザに1日キャッシュさせる
_CACHE_CONTROL = "private, max-age=86400"
# ビルドが欠けている（タイムラインがない）応答は、後で取得できる可能性があるため再確認させる
_CACHE_CONTROL_INCOMPLETE = "private, no-cache"


@router.get("/{matchId}")
async def get_match(
    response: Response,
    matchId: Annotated[str, Path(pattern=r"^[A-Z0-9]{2,5}_[0-9]{1,20}$")],
) -> MatchDetailResponse:
    """試合詳細（10人の成績・チームの結果・ビルド）を取得する。

    Args:
        matchId: 試合 ID（例: JP1_123456789）

    Raises:
        HTTPException: 404（DB にない試合）、422（試合 ID の形式が不正）、
            429（Riot API のレート制限）、500（サーバーエラー）、502（試合詳細を取得できない）
    """
    try:
        detail = await get_match_detail(matchId)
    except HTTPException:
        raise
    except Exception:
        logger.error("試合詳細 API で予期しないエラーが発生しました", exc_info=True)
        raise HTTPException(
            status_code=500, detail="サーバーエラーが発生しました"
        ) from None
    complete = all(p.build is not None for p in detail.participants)
    response.headers["Cache-Control"] = (
        _CACHE_CONTROL if complete else _CACHE_CONTROL_INCOMPLETE
    )
    return detail
