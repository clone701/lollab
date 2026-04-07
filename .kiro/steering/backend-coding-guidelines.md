---
inclusion: fileMatch
fileMatchPattern: 'backend/**/*'
---

# バックエンドコーディング規約

## 概要

このドキュメントはバックエンド（FastAPI/Python）開発における技術的なコーディング規約とベストプラクティスを定義します。

## 技術スタック

- **フレームワーク**: FastAPI
- **言語**: Python 3.11+
- **データベース**: PostgreSQL（予定）
- **ORM**: SQLAlchemy（予定）
- **バリデーション**: Pydantic
- **非同期**: asyncio

## プロジェクト構成

```
backend/
├── main.py              # アプリケーションエントリーポイント
├── config.py            # 設定管理
├── api/                 # APIエンドポイント
│   ├── users.py
│   └── notes.py
├── models/              # データモデル
│   └── note_model.py
├── schemas/             # Pydanticスキーマ（今後追加）
├── services/            # ビジネスロジック（今後追加）
└── utils/               # ユーティリティ（今後追加）
```

## コーディングスタイル

### PEP 8準拠

- **インデント**: スペース4つ
- **行の長さ**: 最大88文字（Black準拠）
- **命名規則**:
  - 関数・変数: `snake_case`
  - クラス: `PascalCase`
  - 定数: `UPPER_SNAKE_CASE`
  - プライベート: `_leading_underscore`

```python
# Good
def fetch_user_data(user_id: int) -> dict:
    pass

class UserService:
    pass

MAX_RETRY_COUNT = 3
```

### 型ヒント

**必須**: すべての関数に型ヒントを追加する

```python
from typing import Optional, List, Dict, Any

# Good
def get_user(user_id: int) -> Optional[dict]:
    pass

async def fetch_users(limit: int = 10) -> List[dict]:
    pass

# Bad
def get_user(user_id):
    pass
```

### Docstring

**Google Style** を使用する

```python
def fetch_champion_data(champion_id: str, region: str = "kr") -> dict:
    """チャンピオンデータを取得する
    
    Args:
        champion_id: チャンピオンID
        region: リージョンコード（デフォルト: "kr"）
    
    Returns:
        チャンピオンデータの辞書
    
    Raises:
        ValueError: champion_idが無効な場合
        HTTPException: API呼び出しが失敗した場合
    """
    pass
```

## FastAPI規約

### ルーター定義

```python
from fastapi import APIRouter, HTTPException, status

router = APIRouter(
    prefix="/api/users",
    tags=["users"],
)

@router.get("/{user_id}")
async def get_user(user_id: int):
    """ユーザー情報を取得"""
    pass

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    """ユーザーを作成"""
    pass
```

### レスポンスモデル

```python
from pydantic import BaseModel

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    
    class Config:
        from_attributes = True  # SQLAlchemy対応

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int):
    pass
```

### エラーハンドリング

```python
from fastapi import HTTPException, status

# 404エラー
if not user:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User not found"
    )

# 400エラー
if not is_valid_email(email):
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid email format"
    )

# 500エラー（予期しないエラー）
try:
    result = await some_operation()
except Exception as e:
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"Internal server error: {str(e)}"
    )
```

## Pydanticスキーマ

### 基本定義

```python
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
```

### バリデーション

```python
from pydantic import BaseModel, validator

class UserCreate(BaseModel):
    username: str
    password: str
    
    @validator('username')
    def username_alphanumeric(cls, v):
        if not v.isalnum():
            raise ValueError('Username must be alphanumeric')
        return v
    
    @validator('password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v
```

## データベース操作（SQLAlchemy）

### モデル定義

```python
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # リレーション
    notes = relationship("Note", back_populates="user")
```

### CRUD操作

```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

# Create
async def create_user(db: AsyncSession, user: UserCreate) -> User:
    db_user = User(**user.dict())
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

# Read
async def get_user(db: AsyncSession, user_id: int) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()

# Update
async def update_user(db: AsyncSession, user_id: int, user_update: UserUpdate) -> User:
    db_user = await get_user(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    for key, value in user_update.dict(exclude_unset=True).items():
        setattr(db_user, key, value)
    
    await db.commit()
    await db.refresh(db_user)
    return db_user

# Delete
async def delete_user(db: AsyncSession, user_id: int) -> None:
    db_user = await get_user(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.delete(db_user)
    await db.commit()
```

## 非同期処理

### async/await

```python
import asyncio
from typing import List

# 非同期関数定義
async def fetch_data(url: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        return response.json()

# 並列実行
async def fetch_multiple(urls: List[str]) -> List[dict]:
    tasks = [fetch_data(url) for url in urls]
    results = await asyncio.gather(*tasks)
    return results
```

### 依存性注入

```python
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

async def get_db() -> AsyncSession:
    async with SessionLocal() as session:
        yield session

@router.get("/users/{user_id}")
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    return await get_user(db, user_id)
```

## 設定管理

### config.py

```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # アプリケーション設定
    app_name: str = "LoL Lab API"
    debug: bool = False
    
    # データベース設定
    database_url: str
    
    # CORS設定
    cors_origins: list[str] = ["http://localhost:3000"]
    
    # API設定
    api_v1_prefix: str = "/api/v1"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    return Settings()

# 使用例
settings = get_settings()
```

### 環境変数

```bash
# .env
DATABASE_URL=postgresql+asyncpg://user:password@localhost/dbname
DEBUG=True
CORS_ORIGINS=["http://localhost:3000","https://lollab.vercel.app"]
```

## ロギング

```python
import logging
from logging.config import dictConfig

# ロギング設定
dictConfig({
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "[%(asctime)s] %(levelname)s in %(module)s: %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
        },
    },
    "root": {
        "level": "INFO",
        "handlers": ["console"],
    },
})

logger = logging.getLogger(__name__)

# 使用例
logger.info("User created successfully")
logger.warning("Rate limit approaching")
logger.error("Database connection failed", exc_info=True)
```

## セキュリティ

### パスワードハッシュ化

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
```

### JWT認証

```python
from datetime import datetime, timedelta
from jose import JWTError, jwt

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

## テスト

### pytest

```python
import pytest
from httpx import AsyncClient
from main import app

@pytest.mark.asyncio
async def test_create_user():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/users/",
            json={"username": "testuser", "email": "test@example.com"}
        )
    assert response.status_code == 201
    assert response.json()["username"] == "testuser"

@pytest.mark.asyncio
async def test_get_user_not_found():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/users/999")
    assert response.status_code == 404
```

### フィクスチャ

```python
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

@pytest.fixture
async def db_session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        yield session
    
    await engine.dispose()
```

## パフォーマンス最適化

### キャッシング

```python
from functools import lru_cache
from fastapi_cache import FastAPICache
from fastapi_cache.decorator import cache

# メモリキャッシュ
@lru_cache(maxsize=128)
def get_champion_list() -> list:
    # 重い処理
    pass

# Redisキャッシュ
@router.get("/champions")
@cache(expire=3600)  # 1時間キャッシュ
async def get_champions():
    pass
```

### データベースクエリ最適化

```python
from sqlalchemy.orm import selectinload

# N+1問題を回避
async def get_users_with_notes(db: AsyncSession):
    result = await db.execute(
        select(User).options(selectinload(User.notes))
    )
    return result.scalars().all()
```

## CORS設定

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://lollab.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 参照ドキュメント

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Python Type Hints](https://docs.python.org/3/library/typing.html)
