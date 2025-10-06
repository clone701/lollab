import requests
from config import settings


async def create_champion_note(data):
    required = [
        "user_id", "my_champion_id", "enemy_champion_id",
        "runes", "spells", "items", "memo"
    ]
    if not all(k in data for k in required):
        return {"error": "Missing fields"}, 400

    headers = {
        "apikey": settings.supabase_service_key,
        "Authorization": f"Bearer {settings.supabase_service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    resp = requests.post(
        f"{settings.supabase_url}/rest/v1/champion_notes",
        headers=headers,
        json={k: data[k] for k in required}
    )
    return resp.json(), resp.status_code
