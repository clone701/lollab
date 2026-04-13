from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """ 環境変数を読み込む """
    supabase_url: str
    supabase_service_key: str

    class Config:
        env_file = ".env"  # .envファイルのパスを指定


# インスタンス化して環境変数を読み込む
settings = Settings()
