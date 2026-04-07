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
    try:
        resp = requests.post(url, headers=headers, json=[data])
        if resp.status_code == 409:
            # 既存ユーザーのuuidを取得して返す
            get_url = (
                f"{settings.supabase_url}/rest/v1/app_users"
                f"?email=eq.{user.email}"
            )
            get_resp = requests.get(get_url, headers=headers)
            result = get_resp.json()
            user_id = None
            if isinstance(result, list) and len(result) > 0:
                user_id = result[0].get("id")
            return {"ok": True, "user_id": user_id}
        if resp.status_code not in (200, 201):
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        result = resp.json()
        # 1件目のid(uuid)を返す（Supabase REST APIは配列で返す）
        user_id = None
        if isinstance(result, list) and len(result) > 0:
            user_id = result[0].get("id")
        return {"ok": True, "user_id": user_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/by_email")
async def get_user_by_email(email: str):
    url = f"{settings.supabase_url}/rest/v1/app_users?email=eq.{email}"
    headers = {
        "apikey": settings.supabase_service_key,
        "Authorization": f"Bearer {settings.supabase_service_key}",
    }
    resp = requests.get(url, headers=headers)
    result = resp.json()
    user_id = None
    if isinstance(result, list) and len(result) > 0:
        user_id = result[0].get("id")
        return {"ok": True, "user_id": user_id}
    return {"ok": False, "user_id": None}
