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


@router.post("/champion_notes")
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
