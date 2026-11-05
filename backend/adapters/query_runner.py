"""Supabase クライアントのクエリ実行の共通処理。"""

import asyncio
from collections.abc import Callable
from typing import Any


async def execute(build: Callable[[], Any]) -> list[dict[str, Any]]:
    """build が返すクエリをスレッドで実行し、結果の行リストを返す。

    Supabase クライアントは同期 API のため、asyncio.to_thread で呼び出す。
    """
    response = await asyncio.to_thread(lambda: build().execute())
    return list(response.data or [])
