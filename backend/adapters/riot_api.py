import httpx

from config import settings

BASE_URL = "https://{region}.api.riotgames.com"


async def get(region: str, path: str) -> dict:  # type: ignore[type-arg]
    """Riot API GETリクエスト"""
    url = f"{BASE_URL.format(region=region)}{path}"
    async with httpx.AsyncClient() as client:
        response = await client.get(
            url, headers={"X-Riot-Token": settings.riot_api_key}
        )
        response.raise_for_status()
        return response.json()  # type: ignore[no-any-return]
