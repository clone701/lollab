"""Riot APIエラーハンドリング: HTTPStatusErrorを適切なHTTPExceptionに変換する。"""

import logging
from typing import NoReturn

import httpx
from fastapi import HTTPException

from adapters.riot_rate_limiter import RateLimitExceeded

logger = logging.getLogger(__name__)

_RATE_LIMIT_DETAIL = "レート制限に達しました。しばらく待ってから再試行してください"


def handle_rate_limit_exceeded(e: RateLimitExceeded) -> NoReturn:
    """送信前のレート制限（2分あたりの上限）を429のHTTPExceptionに変換する。

    Args:
        e: レート制限が送出した RateLimitExceeded

    Raises:
        HTTPException: 429
    """
    logger.warning("Riot API の送信前レート制限に達しました: host=%s", e.host)
    raise HTTPException(status_code=429, detail=_RATE_LIMIT_DETAIL)


def handle_request_error(e: httpx.RequestError) -> NoReturn:
    """Riot APIへの接続エラー・タイムアウトを502のHTTPExceptionに変換する。

    Args:
        e: httpxが発生させたRequestError（接続失敗・タイムアウトなど）

    Raises:
        HTTPException: 502
    """
    logger.error("Riot API request error: %s", type(e).__name__, exc_info=True)
    raise HTTPException(status_code=502, detail="Riot APIが一時的に利用できません")


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
        raise HTTPException(status_code=429, detail=_RATE_LIMIT_DETAIL)
    else:
        logger.error("Riot API error: %s", status, exc_info=True)
        raise HTTPException(status_code=502, detail="Riot APIが一時的に利用できません")
