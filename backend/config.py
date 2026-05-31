from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """環境変数を読み込む"""

    # アプリケーション設定
    app_name: str = "LoL Lab API"
    debug: bool = False

    # Supabase設定
    supabase_url: str = ""
    supabase_key: str = ""

    # Riot API設定
    riot_api_key: str = ""

    # CORS設定（カンマ区切り文字列で受け取る）
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        """CORS originsをリストとして返す"""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """設定のシングルトンインスタンスを取得"""
    return Settings()


# グローバル設定インスタンス
settings = get_settings()
