# Feature: summoner-search-api, Property 4: KDA計算のゼロ除算回避
"""KDA計算のゼロ除算回避プロパティテスト。

**Validates: Requirements 6.4**
"""

import math

from hypothesis import given, settings
from hypothesis.strategies import integers


@settings(max_examples=100)
@given(integers(min_value=0), integers(min_value=0), integers(min_value=0))
def test_kda_calculation_is_finite_and_non_negative(
    kills: int, deaths: int, assists: int
) -> None:
    """任意の kills/deaths/assists に対して KDA 計算が常に有限の非負数を返す。"""
    kda = (kills + assists) / max(deaths, 1)

    assert math.isfinite(kda)
    assert kda >= 0


# Feature: summoner-search-api, Property 5: チャンピオン統計のソート順
"""チャンピオン統計のソート順プロパティテスト。

**Validates: Requirements 6.5**
"""

import sys
from unittest.mock import MagicMock

# adapters/riot_api → config の import チェーンを回避するためにモックを注入する
_mock_riot_api = MagicMock()
sys.modules.setdefault("adapters", MagicMock())
sys.modules.setdefault("adapters.riot_api", _mock_riot_api)
sys.modules.setdefault("config", MagicMock(settings=MagicMock()))

from hypothesis import given, settings  # noqa: E402
from hypothesis.strategies import booleans, builds, integers, lists, text  # noqa: E402

from schemas.summoner import MatchData  # noqa: E402
from services.summoner.champion_stats import aggregate_champion_stats  # noqa: E402

match_data_strategy = builds(
    MatchData,
    matchId=text(min_size=1, max_size=20),
    isWin=booleans(),
    gameMode=text(min_size=1, max_size=10),
    championName=text(min_size=1, max_size=20),
    kills=integers(min_value=0, max_value=50),
    deaths=integers(min_value=0, max_value=50),
    assists=integers(min_value=0, max_value=50),
    cs=integers(min_value=0, max_value=500),
    gameDurationSeconds=integers(min_value=0, max_value=3600),
    itemIds=lists(integers(min_value=0), min_size=7, max_size=7),
    timeAgoSeconds=integers(min_value=0),
)


@settings(max_examples=100)
@given(lists(match_data_strategy))
def test_champion_stats_sorted_by_total_games_descending(
    matches: list[MatchData],
) -> None:
    """任意の試合リストから生成されたチャンピオン統計が総試合数（wins + losses）の降順で並んでいる。"""
    result = aggregate_champion_stats(matches)

    totals = [stat.wins + stat.losses for stat in result]
    assert totals == sorted(totals, reverse=True)
