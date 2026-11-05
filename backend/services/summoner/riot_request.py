"""Riot API 呼び出しの共通処理: 429 と送信前のレート制限を RiotRateLimitError にする。"""

from typing import Any

import httpx

from adapters import riot_api
from adapters.riot_rate_limiter import Priority, RateLimitExceeded
from services.summoner.riot_errors import RiotRateLimitError, from_rate_limit_exceeded


async def get_riot(
    host: str,
    path: str,
    params: dict[str, str | int] | None = None,
    priority: Priority = "interactive",
) -> Any:
    """Riot API を呼ぶ。429 は RiotRateLimitError、他の HTTP エラーはそのまま伝える。"""
    try:
        return await riot_api.get(host, path, params=params, priority=priority)
    except RateLimitExceeded as e:
        raise from_rate_limit_exceeded(e) from e
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            raise RiotRateLimitError(e) from e
        raise
