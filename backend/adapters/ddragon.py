"""Data Dragon（Riot の静的データ配信）の取得。

Riot API とはホストが別でレート制限の対象外のため、riot_api は経由しない。
"""

from typing import Any

import httpx

BASE_URL = "https://ddragon.leagueoflegends.com"
_TIMEOUT_SECONDS = 15.0


async def _get_json(path: str) -> Any:
    async with httpx.AsyncClient(timeout=_TIMEOUT_SECONDS) as client:
        response = await client.get(f"{BASE_URL}{path}")
        response.raise_for_status()
        return response.json()


async def fetch_versions() -> list[str]:
    """版の一覧を新しい順に返す。"""
    return list(await _get_json("/api/versions.json"))


async def fetch_items(version: str) -> dict[str, dict[str, Any]]:
    """指定した版の item.json の data（itemId → アイテム情報）を返す。"""
    body = await _get_json(f"/cdn/{version}/data/en_US/item.json")
    return dict(body["data"])
