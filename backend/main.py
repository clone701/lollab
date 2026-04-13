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


@app.get("/")
async def root():
    """ヘルスチェック用エンドポイント"""
    return {"status": "ok", "message": "LoL Lab API is running"}


@app.get("/health")
async def health_check():
    """ヘルスチェック"""
    return {"status": "healthy"}
