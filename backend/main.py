from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from adapters import riot_api
from api.favorites.router import router as favorites_router
from api.summoner.router import router as summoner_router
from config import settings


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """アプリケーションの起動・終了処理。終了時に Riot API クライアントを閉じる。"""
    yield
    await riot_api.close()


app = FastAPI(title=settings.app_name, lifespan=lifespan)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーター登録
app.include_router(summoner_router)
app.include_router(favorites_router)


@app.get("/")
async def root() -> dict:
    """ヘルスチェック用エンドポイント"""
    return {"status": "ok", "message": "LoL Lab API is running"}


@app.get("/health")
async def health_check() -> dict:
    """ヘルスチェック"""
    return {"status": "healthy"}
