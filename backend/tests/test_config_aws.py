"""config の AWS 向け設定のテスト: 既定値、派生値、SSM からの読み込み（moto でモック）。

_Requirements: 6.1, 6.2_
"""

import importlib.util
import os
from collections.abc import Iterator
from pathlib import Path
from types import ModuleType

import boto3
import pytest
from moto import mock_aws
from pydantic import ValidationError

_SETTING_ENV_NAMES = (
    "USER_GATE_ENABLED",
    "ALLOWED_EMAILS",
    "SUPABASE_JWT_SECRET",
    "SUPABASE_PROJECT_REF",
    "SUPABASE_URL",
    "BACKFILL_MODE",
    "BACKFILL_FUNCTION_NAME",
    "RAW_BUCKET",
    "SSM_PARAMETER_PATH",
    "SSM_PARAMETER_NAMES",
    "RIOT_API_KEY",
)


@pytest.fixture
def config(monkeypatch: pytest.MonkeyPatch) -> ModuleType:
    """環境変数を外した状態の config。他のテストが sys.modules を差し替えていても、パスから読み込む。"""
    # テスト内で os.environ に書き込んでも、他のテストに残さない
    monkeypatch.setattr(os, "environ", os.environ.copy())
    for name in _SETTING_ENV_NAMES:
        monkeypatch.delenv(name, raising=False)
    path = Path(__file__).resolve().parent.parent / "config.py"
    spec = importlib.util.spec_from_file_location("config_aws_under_test", path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.fixture
def ssm(monkeypatch: pytest.MonkeyPatch) -> Iterator[object]:
    for name in ("AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN"):
        monkeypatch.setenv(name, "testing")
    monkeypatch.setenv("AWS_DEFAULT_REGION", "ap-northeast-1")
    with mock_aws():
        yield boto3.client("ssm")


# --- 既定値と派生値 ---


def test_defaults_keep_local_development_unchanged(config: ModuleType) -> None:
    settings = config.Settings(_env_file=None)

    assert settings.user_gate_enabled is False
    assert settings.backfill_mode == "inline"
    assert settings.raw_bucket == ""
    assert settings.backfill_function_name == ""
    assert settings.allowed_emails_list == []
    assert settings.supabase_jwks_url is None


def test_allowed_emails_are_split_trimmed_and_lowercased(
    config: ModuleType, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("ALLOWED_EMAILS", " A@Example.com, b@example.com ,,")
    settings = config.Settings(_env_file=None)

    assert settings.allowed_emails_list == ["a@example.com", "b@example.com"]


def test_jwks_url_from_project_ref(
    config: ModuleType, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("SUPABASE_PROJECT_REF", "abcdef")
    monkeypatch.setenv("SUPABASE_URL", "https://other.supabase.co")
    settings = config.Settings(_env_file=None)

    assert (
        settings.supabase_jwks_url
        == "https://abcdef.supabase.co/auth/v1/.well-known/jwks.json"
    )


def test_jwks_url_from_supabase_url(
    config: ModuleType, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("SUPABASE_URL", "https://xyz.supabase.co/")
    settings = config.Settings(_env_file=None)

    assert (
        settings.supabase_jwks_url
        == "https://xyz.supabase.co/auth/v1/.well-known/jwks.json"
    )


def test_invalid_backfill_mode_is_rejected(
    config: ModuleType, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("BACKFILL_MODE", "thread")

    with pytest.raises(ValidationError):
        config.Settings(_env_file=None)


# --- SSM ---


def _put(ssm: object, name: str, value: str, kind: str = "String") -> None:
    ssm.put_parameter(Name=name, Value=value, Type=kind)  # type: ignore[attr-defined]


def test_load_ssm_parameters_sets_uppercased_env(
    config: ModuleType, ssm: object
) -> None:
    _put(ssm, "/lollab/riot_api_key", "secret-key", "SecureString")
    _put(ssm, "/lollab/allowed_emails", "a@example.com,b@example.com", "StringList")
    _put(ssm, "/other/riot_api_key", "not-mine")

    config.load_ssm_parameters("/lollab/")

    assert os.environ["RIOT_API_KEY"] == "secret-key"
    assert os.environ["ALLOWED_EMAILS"] == "a@example.com,b@example.com"


def test_load_ssm_parameters_does_not_override_existing_env(
    config: ModuleType, ssm: object, monkeypatch: pytest.MonkeyPatch
) -> None:
    _put(ssm, "/lollab/riot_api_key", "from-ssm", "SecureString")
    monkeypatch.setenv("RIOT_API_KEY", "from-env")

    config.load_ssm_parameters("/lollab/")

    assert os.environ["RIOT_API_KEY"] == "from-env"


def test_load_ssm_parameters_reads_all_pages(config: ModuleType, ssm: object) -> None:
    for i in range(12):
        _put(ssm, f"/lollab/param_{i:02d}", f"v{i}")

    config.load_ssm_parameters("/lollab/")

    assert all(os.environ[f"PARAM_{i:02d}"] == f"v{i}" for i in range(12))


def test_get_settings_loads_ssm_before_creating_settings(
    config: ModuleType, ssm: object, monkeypatch: pytest.MonkeyPatch
) -> None:
    _put(ssm, "/lollab/riot_api_key", "from-ssm", "SecureString")
    _put(ssm, "/lollab/allowed_emails", "me@example.com", "StringList")
    monkeypatch.setenv("SSM_PARAMETER_PATH", "/lollab/")
    monkeypatch.chdir(Path(__file__).parent)  # .env を読まない場所で作る
    config.get_settings.cache_clear()

    settings = config.get_settings()

    assert settings.riot_api_key == "from-ssm"
    assert settings.allowed_emails_list == ["me@example.com"]


def test_load_ssm_parameters_by_names_reads_only_named(
    config: ModuleType, ssm: object
) -> None:
    _put(ssm, "/lollab/riot_api_key", "secret-key", "SecureString")
    _put(ssm, "/lollab/supabase_url", "https://x.supabase.co")
    _put(ssm, "/lollab/allowed_emails", "me@example.com", "StringList")

    config.load_ssm_parameters_by_names("/lollab/", ["riot_api_key", "supabase_url"])

    assert os.environ["RIOT_API_KEY"] == "secret-key"
    assert os.environ["SUPABASE_URL"] == "https://x.supabase.co"
    assert "ALLOWED_EMAILS" not in os.environ


def test_load_ssm_parameters_by_names_does_not_override_existing_env(
    config: ModuleType, ssm: object, monkeypatch: pytest.MonkeyPatch
) -> None:
    _put(ssm, "/lollab/riot_api_key", "from-ssm", "SecureString")
    monkeypatch.setenv("RIOT_API_KEY", "from-env")

    config.load_ssm_parameters_by_names("/lollab", ["riot_api_key"])

    assert os.environ["RIOT_API_KEY"] == "from-env"


def test_load_ssm_parameters_by_names_splits_into_chunks_of_ten(
    config: ModuleType, ssm: object
) -> None:
    names = [f"param_{i:02d}" for i in range(12)]
    for i, name in enumerate(names):
        _put(ssm, f"/lollab/{name}", f"v{i}")

    config.load_ssm_parameters_by_names("/lollab/", names)

    assert all(os.environ[f"PARAM_{i:02d}"] == f"v{i}" for i in range(12))


def test_load_ssm_parameters_by_names_raises_with_missing_name_only(
    config: ModuleType, ssm: object
) -> None:
    _put(ssm, "/lollab/riot_api_key", "secret-value", "SecureString")

    with pytest.raises(RuntimeError) as excinfo:
        config.load_ssm_parameters_by_names("/lollab/", ["riot_api_key", "missing"])

    assert "/lollab/missing" in str(excinfo.value)
    assert "secret-value" not in str(excinfo.value)


def test_get_settings_uses_names_when_specified(
    config: ModuleType, ssm: object, monkeypatch: pytest.MonkeyPatch
) -> None:
    _put(ssm, "/lollab/riot_api_key", "from-ssm", "SecureString")
    _put(ssm, "/lollab/allowed_emails", "me@example.com", "StringList")
    monkeypatch.setenv("SSM_PARAMETER_PATH", "/lollab/")
    monkeypatch.setenv("SSM_PARAMETER_NAMES", "riot_api_key")
    monkeypatch.chdir(Path(__file__).parent)  # .env を読まない場所で作る
    config.get_settings.cache_clear()

    settings = config.get_settings()

    assert settings.riot_api_key == "from-ssm"
    assert settings.allowed_emails_list == []


def test_get_settings_without_path_does_not_call_ssm(
    config: ModuleType, monkeypatch: pytest.MonkeyPatch
) -> None:
    def fail(path: str) -> None:
        raise AssertionError("SSM を呼んではいけない")

    monkeypatch.setattr(config, "load_ssm_parameters", fail)
    config.get_settings.cache_clear()

    config.get_settings()
