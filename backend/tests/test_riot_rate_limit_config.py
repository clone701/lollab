"""config のレート制限設定のテスト: 既定値、環境変数での切り替え、不正値は読み込み時にエラー。"""

import importlib.util
from pathlib import Path
from types import ModuleType

import pytest
from pydantic import ValidationError

_ENV_NAMES = (
    "RIOT_RATE_LIMITS",
    "RIOT_RATE_LIMIT_MAX_WAIT_SECONDS",
    "RIOT_BACKFILL_RESERVE_RATIO",
)


@pytest.fixture
def config(monkeypatch: pytest.MonkeyPatch) -> ModuleType:
    """環境変数を外した状態の config。他のテストが sys.modules を差し替えていても、パスから読み込む。"""
    for name in _ENV_NAMES:
        monkeypatch.delenv(name, raising=False)
    path = Path(__file__).resolve().parent.parent / "config.py"
    spec = importlib.util.spec_from_file_location("config_under_test", path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_defaults_are_personal_key_with_margin(config: ModuleType) -> None:
    """既定値は Personal キー（20/秒・100/2分）の約9割・予約3割。"""
    settings = config.Settings(_env_file=None)

    assert settings.riot_rate_limit_windows == [(18, 1.0), (95, 120.0)]
    assert settings.riot_rate_limit_max_wait_seconds == 10
    assert settings.riot_backfill_reserve_ratio == 0.3


def test_environment_variables_switch_to_production(
    config: ModuleType, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("RIOT_RATE_LIMITS", "450:10,27000:600")
    monkeypatch.setenv("RIOT_RATE_LIMIT_MAX_WAIT_SECONDS", "10")
    monkeypatch.setenv("RIOT_BACKFILL_RESERVE_RATIO", "0.5")

    settings = config.Settings(_env_file=None)

    assert settings.riot_rate_limit_windows == [(450, 10.0), (27000, 600.0)]
    assert settings.riot_backfill_reserve_ratio == 0.5


def test_windows_are_sorted_by_seconds_and_whitespace_is_allowed(
    config: ModuleType,
) -> None:
    assert config.parse_rate_limits(" 95:120 , 5:10,18:1 ") == [
        (18, 1.0),
        (5, 10.0),
        (95, 120.0),
    ]


@pytest.mark.parametrize(
    "value",
    [
        "",
        "   ",
        ",",
        "18:1,",
        "18",
        "18:",
        ":1",
        "a:1",
        "18:b",
        "1.5:1",
        "18:1:2",
        "0:1",
        "-1:1",
        "18:0",
        "18:-1",
        "18:nan",
        "18:inf",
        "18:1,95:1",
        "18:1,95:1.0",
    ],
)
def test_invalid_rate_limits_fail_at_load(
    config: ModuleType, monkeypatch: pytest.MonkeyPatch, value: str
) -> None:
    monkeypatch.setenv("RIOT_RATE_LIMITS", value)

    with pytest.raises(ValidationError):
        config.Settings(_env_file=None)


@pytest.mark.parametrize(
    ("name", "value"),
    [
        ("RIOT_RATE_LIMIT_MAX_WAIT_SECONDS", "-1"),
        ("RIOT_RATE_LIMIT_MAX_WAIT_SECONDS", "abc"),
        ("RIOT_BACKFILL_RESERVE_RATIO", "-0.1"),
        ("RIOT_BACKFILL_RESERVE_RATIO", "1.5"),
        ("RIOT_BACKFILL_RESERVE_RATIO", "abc"),
    ],
)
def test_invalid_max_wait_or_ratio_fail_at_load(
    config: ModuleType, monkeypatch: pytest.MonkeyPatch, name: str, value: str
) -> None:
    monkeypatch.setenv(name, value)

    with pytest.raises(ValidationError):
        config.Settings(_env_file=None)
