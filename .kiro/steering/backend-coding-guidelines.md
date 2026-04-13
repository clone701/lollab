---
inclusion: fileMatch
fileMatchPattern: 'backend/**/*'
---

# バックエンドコーディング規約

## プロジェクト固有ルール

### 設定管理（config.py）

```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # アプリケーション設定
    app_name: str = "LoL Lab API"
    debug: bool = False
    
    # Supabase設定
    supabase_url: str
    supabase_key: str
    
    # Riot API設定
    riot_api_key: str
    
    # CORS設定
    cors_origins: list[str] = ["http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
```

### FastAPI構成

#### main.py
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings

app = FastAPI(title=settings.app_name)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーター登録
from api import notes, users
app.include_router(notes.router)
app.include_router(users.router)
```

#### APIルーター
```python
from fastapi import APIRouter, HTTPException, status

router = APIRouter(
    prefix="/api/notes",
    tags=["notes"],
)

@router.get("/")
async def get_notes():
    """ノート一覧を取得"""
    pass

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_note(note: NoteCreate):
    """ノートを作成"""
    pass
```

### Pydanticスキーマ

```python
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class NoteBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    content: str

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    content: Optional[str] = None

class NoteResponse(NoteBase):
    id: int
    user_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True
```

### Supabase連携

```python
from supabase import create_client, Client
from config import settings

supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_key
)

# データ取得
async def get_notes(user_id: str):
    response = supabase.table('notes').select('*').eq('user_id', user_id).execute()
    return response.data

# データ作成
async def create_note(note_data: dict):
    response = supabase.table('notes').insert(note_data).execute()
    return response.data[0]

# データ更新
async def update_note(note_id: int, note_data: dict):
    response = supabase.table('notes').update(note_data).eq('id', note_id).execute()
    return response.data[0]

# データ削除
async def delete_note(note_id: int):
    response = supabase.table('notes').delete().eq('id', note_id).execute()
    return response.data
```

### エラーハンドリング

```python
from fastapi import HTTPException, status

# 404エラー
if not note:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Note not found"
    )

# 400エラー
if not is_valid(data):
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid data format"
    )

# 500エラー
try:
    result = await operation()
except Exception as e:
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"Internal error: {str(e)}"
    )
```

### 非同期処理

```python
import asyncio
from typing import List

# 非同期関数
async def fetch_data(url: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        return response.json()

# 並列実行
async def fetch_multiple(urls: List[str]) -> List[dict]:
    tasks = [fetch_data(url) for url in urls]
    return await asyncio.gather(*tasks)
```

### 依存性注入

```python
from fastapi import Depends

def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    # トークン検証
    return user

@router.get("/notes")
async def get_user_notes(user: dict = Depends(get_current_user)):
    return await get_notes(user['id'])
```

### 環境変数

```bash
# .env
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-service-key
RIOT_API_KEY=your-riot-api-key
CORS_ORIGINS=["http://localhost:3000","https://lollab.onrender.com"]
DEBUG=False
```

### ロギング

```python
import logging

logger = logging.getLogger(__name__)

# 使用例
logger.info("Note created successfully")
logger.warning("Rate limit approaching")
logger.error("Database error", exc_info=True)
```

### Vercelデプロイ設定

```json
// vercel.json
{
  "builds": [
    {
      "src": "main.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "main.py"
    }
  ]
}
```
