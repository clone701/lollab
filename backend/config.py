from functools import lru_cache
from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """環境変数を読み込む"""

    # アプリケーション設定
    app_name: str = "LoL Lab API"
    debug: bool = False

    # Supabase設定
    supabase_url: str = ""
    supabase_key: str = ""

    # Riot API設定（オプショナル - 今後使用）
    riot_api_key: str = ""

    # CORS設定
    cors_origins: list[str] = ["http://localhost:3000"]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            # JSON配列形式またはカンマ区切りに対応
            v = v.strip()
            if v.startswith("["):
                import json

                return json.loads(v)  # type: ignore[no-any-return]
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """設定のシングルトンインスタンスを取得"""
    return Settings()


# グローバル設定インスタンス
settings = get_settings()
