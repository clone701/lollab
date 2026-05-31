"""champion_stats.py のユニットテスト。

試合履歴なし時の空リスト返却と集計ロジックの正確性を確認する。

_Requirements: 6.3, 6.6_
"""

import sys
from types import ModuleType
from unittest.mock import AsyncMock, MagicMock

# config と adapters.riot_api をモジュールレベルでモックして
# 環境変数なしでもインポートできるようにする
_mock_settings = MagicMock()
_mock_settings.riot_api_key = "test-key"

_mock_config = ModuleType("config")
_mock_config.settings = _mock_settings  # type: ignore[attr-defined]
sys.modules.setdefault("config", _mock_config)

_mock_riot_api = ModuleType("adapters.riot_api")
_mock_riot_api.get = AsyncMock()  # type: ignore[attr-defined]
sys.modules.setdefault("adapters.riot_api", _mock_riot_api)

_mock_adapters = sys.modules.get("adapters") or ModuleType("adapters")
sys.modules.setdefault("adapters", _mock_adapters)

from schemas.summoner import MatchData  # noqa: E402
from services.summoner.champion_stats import aggregate_champion_stats  # noqa: E402


def test_aggregate_champion_stats_empty_returns_empty_list() -> None:
    """試合履歴が空のとき、空リストを返す。

    _Requirements: 6.6_
    """
    result = aggregate_champion_stats([])

    assert result == []


def test_aggregate_champion_stats_aggregates_correctly() -> None:
    """既知の試合データに対して wins/losses/cs/kda が正しく集計される。

    _Requirements: 6.3_
    """
    matches = [
        MatchData(
            matchId="m1",
            isWin=True,
            gameMode="CLASSIC",
            championName="Ahri",
            kills=5,
            deaths=2,
            assists=8,
            cs=150,
            gameDurationSeconds=1800,
            itemIds=[0] * 7,
            timeAgoSeconds=100,
        ),
        MatchData(
            matchId="m2",
            isWin=False,
            gameMode="CLASSIC",
            championName="Ahri",
            kills=3,
            deaths=4,
            assists=2,
            cs=100,
            gameDurationSeconds=1500,
            itemIds=[0] * 7,
            timeAgoSeconds=200,
        ),
    ]

    result = aggregate_champion_stats(matches)

    assert len(result) == 1
    stat = result[0]
    assert stat.championName == "Ahri"
    assert stat.wins == 1
    assert stat.losses == 1
    # cs は平均: (150 + 100) / 2 = 125.0
    assert stat.cs == 125.0
    # kda = (kills + assists) / max(deaths, 1) = (8 + 10) / max(6, 1) = 3.0
    assert stat.kda == 3.0


def test_aggregate_champion_stats_kda_zero_deaths() -> None:
    """deaths=0 のとき、ゼロ除算を回避して kda = (kills + assists) / 1 を返す。

    _Requirements: 6.3_
    """
    matches = [
        MatchData(
            matchId="m1",
            isWin=True,
            gameMode="CLASSIC",
            championName="Zed",
            kills=10,
            deaths=0,
            assists=5,
            cs=200,
            gameDurationSeconds=1800,
            itemIds=[0] * 7,
            timeAgoSeconds=100,
        ),
    ]

    result = aggregate_champion_stats(matches)

    assert len(result) == 1
    stat = result[0]
    assert stat.championName == "Zed"
    # kda = (10 + 5) / max(0, 1) = 15.0
    assert stat.kda == 15.0
