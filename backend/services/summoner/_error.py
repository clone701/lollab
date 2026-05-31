"""Riot APIエラーハンドリング: HTTPStatusErrorを適切なHTTPExceptionに変換する。"""

import logging

import httpx
from fastapi import HTTPException

logger = logging.getLogger(__name__)


def handle_riot_error(e: httpx.HTTPStatusError) -> None:
    """Riot APIのHTTPエラーをFastAPI用のHTTPExceptionに変換する。

    Args:
        e: httpxが発生させたHTTPStatusError

    Raises:
        HTTPException: 404, 429, または 502
    """
    status = e.response.status_code
    if status == 404:
        raise HTTPException(status_code=404, detail="サモナーが見つかりません")
    elif status == 429:
        raise HTTPException(
            status_code=429,
            detail="レート制限に達しました。しばらく待ってから再試行してください",
        )
    else:
        logger.error("Riot API error: %s", status, exc_info=True)
        raise HTTPException(status_code=502, detail="Riot APIが一時的に利用できません")
