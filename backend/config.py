from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """環境変数を読み込む"""
    # アプリケーション設定
    app_name: str = "LoL Lab API"
    debug: bool = False
    
    # Supabase設定
    supabase_url: str
    supabase_key: str
    
    # Riot API設定（オプショナル - 今後使用）
    riot_api_key: str = ""
    
    # CORS設定
    cors_origins: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """設定のシングルトンインスタンスを取得"""
    return Settings()


# グローバル設定インスタンス
settings = get_settings()
