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

# ルーター登録（機能追加時にここに追加）
# from api.{feature} import router as {feature}_router
# app.include_router({feature}_router)


@app.get("/")
async def root() -> dict:
    """ヘルスチェック用エンドポイント"""
    return {"status": "ok", "message": "LoL Lab API is running"}


@app.get("/health")
async def health_check() -> dict:
    """ヘルスチェック"""
    return {"status": "healthy"}
