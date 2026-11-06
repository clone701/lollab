import json
import logging
import math
import os
from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)


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


def load_ssm_parameters(path: str) -> None:
    """SSM Parameter Store の path 配下を読み、環境変数に設定する。

    パラメータ名の末尾（例: /lollab/riot_api_key の riot_api_key）を大文字にした
    名前で設定する。既に環境変数がある値は上書きしない。Settings を作る前に呼ぶ。
    """
    import boto3

    client = boto3.client("ssm")
    token: str | None = None
    while True:
        extra = {"NextToken": token} if token else {}
        response = client.get_parameters_by_path(
            Path=path, WithDecryption=True, **extra
        )
        for parameter in response.get("Parameters", []):
            name = parameter["Name"].rsplit("/", 1)[-1].upper()
            os.environ.setdefault(name, parameter["Value"])
        token = response.get("NextToken")
        if not token:
            return


def load_ssm_parameters_by_names(path: str, names: list[str]) -> None:
    """SSM Parameter Store から path 配下の指定した名前だけを読み、環境変数に設定する。

    GetParametersByPath はパス単位でしか権限を判定できないため、読ませるパラメータを
    絞りたい関数（backfill）では、名前を指定する GetParameters で読む。
    環境変数の名前と既存値を上書きしない点は load_ssm_parameters と同じ。

    Raises:
        RuntimeError: 存在しない、または読む権限のないパラメータがある（値は含めない）
    """
    import boto3

    client = boto3.client("ssm")
    prefix = path.rstrip("/") + "/"
    full_names = [prefix + name for name in names]
    # GetParameters は 1 回に 10 件まで
    for start in range(0, len(full_names), 10):
        response = client.get_parameters(
            Names=full_names[start : start + 10], WithDecryption=True
        )
        invalid = response.get("InvalidParameters", [])
        if invalid:
            raise RuntimeError(f"SSM パラメータを読み込めません: {', '.join(invalid)}")
        for parameter in response.get("Parameters", []):
            name = parameter["Name"].rsplit("/", 1)[-1].upper()
            os.environ.setdefault(name, parameter["Value"])


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

    # ユーザー制限（第2段階）。false なら判定を省略する。Lambda では true にする
    user_gate_enabled: bool = False
    # 許可するメールアドレス（カンマ区切り）。有効時に空なら全員拒否する
    allowed_emails: str = ""
    # HS256 のトークンを検証するシークレット。未設定なら HS256 は拒否する
    supabase_jwt_secret: str = ""
    # JWKS の URL を作るプロジェクト参照。未設定なら supabase_url から作る
    supabase_project_ref: str = ""

    # Backfill の起動方法。inline = API と同じプロセス、lambda = 別の Lambda を非同期起動
    backfill_mode: Literal["inline", "lambda"] = "inline"
    backfill_function_name: str = ""

    # 試合の生データを保存する S3 バケット。未設定なら Supabase Storage を使う
    raw_bucket: str = ""

    # 設定を読む SSM パラメータのパス（例: /lollab/）。読み込みは get_settings が行う
    ssm_parameter_path: str = ""

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
    def allowed_emails_list(self) -> list[str]:
        """許可するメールアドレスを小文字のリストで返す。"""
        return [e.strip().lower() for e in self.allowed_emails.split(",") if e.strip()]

    @property
    def supabase_jwks_url(self) -> str | None:
        """Supabase Auth の JWKS の URL。作れなければ None。"""
        if self.supabase_project_ref:
            base = f"https://{self.supabase_project_ref}.supabase.co"
        elif self.supabase_url:
            base = self.supabase_url.rstrip("/")
        else:
            return None
        return f"{base}/auth/v1/.well-known/jwks.json"

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
    """設定のシングルトンインスタンスを取得。SSM_PARAMETER_PATH があれば先に読む。

    SSM_PARAMETER_NAMES（カンマ区切り）も設定されていれば、その名前だけを読む。
    """
    path = os.environ.get("SSM_PARAMETER_PATH")
    if path:
        names = [
            n.strip()
            for n in os.environ.get("SSM_PARAMETER_NAMES", "").split(",")
            if n.strip()
        ]
        if names:
            load_ssm_parameters_by_names(path, names)
        else:
            load_ssm_parameters(path)
        logger.info("SSM からパラメータを読み込みました: %s", path)
    return Settings()


# グローバル設定インスタンス
settings = get_settings()
