from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import os
import requests

app = FastAPI()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")  # サービスロールキー推奨


@app.post("/api/notes/champion_notes")
async def create_note(request: Request):
    data = await request.json()
    required = [
        "user_id",
        "my_champion_id",
        "enemy_champion_id",
        "runes",
        "spells",
        "items",
        "memo"
    ]
    if not all(k in data for k in required):
        return JSONResponse({"error": "Missing fields"}, status_code=400)

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/champion_notes",
        headers=headers,
        json={
            "user_id": data["user_id"],
            "my_champion_id": data["my_champion_id"],
            "enemy_champion_id": data["enemy_champion_id"],
            "runes": data["runes"],
            "spells": data["spells"],
            "items": data["items"],
            "memo": data["memo"]
        }
    )
    return JSONResponse(resp.json(), status_code=resp.status_code)
