from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config import settings
import requests

router = APIRouter()


class UserRegister(BaseModel):
    email: str
    name: str
    image: str | None = None
    provider: str
    provider_id: str


@router.post("/register")
async def register_user(user: UserRegister):
    # Supabaseのapp_usersテーブルにUPSERT
    url = f"{settings.supabase_url}/rest/v1/app_users"
    headers = {
        "apikey": settings.supabase_service_key,
        "Authorization": f"Bearer {settings.supabase_service_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }
    data = user.dict()
    # emailで一意にUPSERT
    try:
        resp = requests.post(url, headers=headers, json=[data])
        if resp.status_code not in (200, 201):
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        return {"ok": True, "result": resp.json()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
