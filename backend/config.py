import json
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

    # Riot API レート制限（Personal キーの上限。Production キーに切り替えたら変更する）
    riot_rate_limit_per_second: int = 18
    riot_rate_limit_per_2min: int = 95
    # Backfill が検索・更新用に残す、2分あたりの回数
    riot_backfill_reserve: int = 30

    # CORS設定（文字列で受け取る。list[str] にすると pydantic-settings が
    # 環境変数を JSON として解釈しようとし、カンマ区切りで起動に失敗するため）
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        """CORS origins をリストで返す。JSON配列形式とカンマ区切りの両方に対応する。"""
        value = self.cors_origins.strip()
        if value.startswith("["):
            return [str(origin).strip() for origin in json.loads(value)]
        return [origin.strip() for origin in value.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """設定のシングルトンインスタンスを取得"""
    return Settings()


# グローバル設定インスタンス
settings = get_settings()
