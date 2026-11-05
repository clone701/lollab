import asyncio
import logging
import re
from collections.abc import Awaitable, Callable

import httpx

from adapters.riot_rate_limiter import Priority, get_limiter
from config import settings

logger = logging.getLogger(__name__)

BASE_URL = "https://{region}.api.riotgames.com"

# 429 の Retry-After がこの秒数以内なら、待って1回だけ再送する
MAX_RETRY_AFTER_SECONDS = 2.0
_RETRY_AFTER_PATTERN = re.compile(r"\d+(\.\d+)?", re.ASCII)

# 再送前の待機。テストで実時間を待たないよう差し替えられる
_sleep: Callable[[float], Awaitable[None]] = asyncio.sleep

# リクエストごとに接続を作り直さないよう、モジュール単位で使い回す
_client: httpx.AsyncClient | None = None


def _get_client() -> httpx.AsyncClient:
    """共有 AsyncClient を返す。未作成または close 済みなら作成する。"""
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient()
    return _client


def _retry_after_seconds(response: httpx.Response) -> float | None:
    """Retry-After が数値で 0 より大きく 2 秒以下なら、その秒数を返す。それ以外は None。"""
    value = response.headers.get("Retry-After", "").strip()
    if not _RETRY_AFTER_PATTERN.fullmatch(value):
        return None
    seconds = float(value)
    if 0 < seconds <= MAX_RETRY_AFTER_SECONDS:
        return seconds
    return None


async def _send(
    region: str,
    path: str,
    params: dict[str, str | int] | None,
    priority: Priority,
) -> httpx.Response:
    """レート制限を確認してから1回送信する。"""
    await get_limiter().acquire(region, priority)
    url = f"{BASE_URL.format(region=region)}{path}"
    return await _get_client().get(
        url,
        params=params,
        headers={"X-Riot-Token": settings.riot_api_key},
    )


async def get(
    region: str,
    path: str,
    params: dict[str, str | int] | None = None,
    priority: Priority = "interactive",
) -> dict:  # type: ignore[type-arg]
    """Riot API GETリクエスト

    送信前にレート制限を確認する。1秒の上限は待機し、2分の上限は例外にする。
    "interactive" が 429 を受け、Retry-After が2秒以内なら、待ってから1回だけ再送する
    （再送もレート制限のカウント対象）。

    Args:
        region: ホスト識別子（例: "jp1", "asia"）
        path: リクエストパス（クエリ文字列を含めてもよい）
        params: クエリパラメータ（省略可）
        priority: "interactive"（検索・更新）または "backfill"（残り回数を予約）

    Raises:
        RateLimitExceeded: 2分の上限に達した（Backfill は予約分を下回った）
        httpx.HTTPStatusError: Riot API がエラーを返した
    """
    response = await _send(region, path, params, priority)
    if response.status_code == 429 and priority == "interactive":
        wait = _retry_after_seconds(response)
        if wait is not None:
            logger.warning("Riot API が 429 を返したため再送します: host=%s", region)
            await _sleep(wait)
            response = await _send(region, path, params, priority)
    response.raise_for_status()
    return response.json()  # type: ignore[no-any-return]


async def close() -> None:
    """共有 AsyncClient を閉じる。アプリケーション終了時に呼ぶ。"""
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None
