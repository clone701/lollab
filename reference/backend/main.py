from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import notes
from api.users import router as users_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番は ["https://あなたのフロントURL"] などにする
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(notes.router, prefix="/api/notes")
app.include_router(users_router, prefix="/api/users")
