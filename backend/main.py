from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time

app = FastAPI()

# ここでCORSを設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番は ["https://あなたのフロントURL"] などにする
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return JSONResponse({
        "ok": True,
        "service": "lollab",
        "time": int(time.time())
    })
