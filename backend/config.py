import json
import math
from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


def parse_rate_limits(value: str) -> list[tuple[int, float]]:
    """「回数:秒」のカンマ区切り（例: "18:1,95:120"）を、秒の昇順の (回数, 秒) にする。

    Raises:
        ValueError: 空、形式違反、数値でない、0以下、秒の重複
    """
    items = [item.strip() for item in value.split(",")]
    if not value.strip() or "" in items:
        raise ValueError("RIOT_RATE_LIMITS が空、または空の要素を含んでいます")

    windows: dict[float, int] = {}
    for item in items:
        count_text, sep, seconds_text = item.partition(":")
        try:
            if not sep:
                raise ValueError
            count = int(count_text)
            seconds = float(seconds_text)
        except ValueError:
            raise ValueError(
                f"RIOT_RATE_LIMITS の要素は「回数:秒」の形式にしてください: {item!r}"
            ) from None
        if count <= 0 or not math.isfinite(seconds) or seconds <= 0:
            raise ValueError(f"回数と秒は正の数にしてください: {item!r}")
        if seconds in windows:
            raise ValueError(f"RIOT_RATE_LIMITS で秒が重複しています: {seconds:g}")
        windows[seconds] = count
    return [(count, seconds) for seconds, count in sorted(windows.items())]


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

    # Riot API レート制限。「回数:秒」のカンマ区切り（既定は Personal キーの約9割）。
    # Production キーに切り替えたら RIOT_RATE_LIMITS=450:10,27000:600 にする。
    # 文字列で受け取る理由は cors_origins と同じ（パース結果は riot_rate_limit_windows）
    riot_rate_limits: str = "18:1,95:120"
    # この秒数以下の窓は空くまで待ち、より長い窓は待たずに例外にする
    riot_rate_limit_max_wait_seconds: float = Field(default=10, ge=0)
    # Backfill が検索・更新用に残す割合（最も長い窓の上限に対する割合）
    riot_backfill_reserve_ratio: float = Field(default=0.3, ge=0, le=1)

    # CORS設定（文字列で受け取る。list[str] にすると pydantic-settings が
    # 環境変数を JSON として解釈しようとし、カンマ区切りで起動に失敗するため）
    cors_origins: str = "http://localhost:3000"

    @field_validator("riot_rate_limits")
    @classmethod
    def _validate_riot_rate_limits(cls, value: str) -> str:
        """形式が不正なら、設定の読み込み時（起動時）にエラーにする。"""
        parse_rate_limits(value)
        return value

    @property
    def riot_rate_limit_windows(self) -> list[tuple[int, float]]:
        """レート制限の窓 (回数, 秒) を、秒の昇順で返す。"""
        return parse_rate_limits(self.riot_rate_limits)

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
