from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config import settings
import requests

router = APIRouter()


class ChampionNote(BaseModel):
    user_id: str
    my_champion_id: str
    enemy_champion_id: str
    runes: dict
    spells: list[str]
    items: list[str]
    memo: str


@router.post("/createChampionNotes")
async def create_champion_note(note: ChampionNote):
    url = f"{settings.supabase_url}/rest/v1/champion_notes"
    headers = {
        "apikey": settings.supabase_service_key,
        "Authorization": f"Bearer {settings.supabase_service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    data = note.dict()
    resp = requests.post(url, headers=headers, json=[data])
    if resp.status_code not in (200, 201):
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()


@router.get("/champion_notes/get")
async def get_champion_notes(
    user_id: str,
    my_champion_id: str,
    enemy_champion_id: str,
):
    """
    GET /api/notes/champion_notes/get?
    user_id=...&my_champion_id=...&enemy_champion_id=...
    Supabase の champion_notes テーブルを REST API 経由で問い合わせて結果を返す。
    """
    url = (
        f"{settings.supabase_url}/rest/v1/champion_notes"
        f"?user_id=eq.{user_id}"
        f"&my_champion_id=eq.{my_champion_id}"
        f"&enemy_champion_id=eq.{enemy_champion_id}"
        f"&select=*"
    )
    headers = {
        "apikey": settings.supabase_service_key,
        "Authorization": f"Bearer {settings.supabase_service_key}",
    }
    resp = requests.get(url, headers=headers)
    if resp.status_code == 200:
        return resp.json()  # Supabase は配列を返す想定
    raise HTTPException(status_code=resp.status_code, detail=resp.text)
