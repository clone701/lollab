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

from services.summoner.champion_stats import (  # noqa: E402
    aggregate_champion_stats,
    aggregate_champion_stats_by_queue,
)
from tests.participation_helpers import participation  # noqa: E402


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
        participation("m1", win=True, kills=5, deaths=2, assists=8, cs=150),
        participation("m2", win=False, kills=3, deaths=4, assists=2, cs=100),
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
        participation("m1", champion_name="Zed", kills=10, deaths=0, assists=5, cs=200),
    ]

    result = aggregate_champion_stats(matches)

    assert len(result) == 1
    stat = result[0]
    assert stat.championName == "Zed"
    # kda = (10 + 5) / max(0, 1) = 15.0
    assert stat.kda == 15.0


def test_aggregate_champion_stats_averages_kda_parts_and_cs_per_minute() -> None:
    """キル / デス / アシストは1試合の平均、分あたり CS は CS 合計 / 試合時間（分）合計。"""
    matches = [
        participation(
            "m1", kills=6, deaths=4, assists=7, cs=180, game_duration=1800
        ),  # 30 分
        participation(
            "m2", kills=7, deaths=5, assists=6, cs=300, game_duration=1200
        ),  # 20 分
    ]

    stat = aggregate_champion_stats(matches)[0]

    assert (stat.kills, stat.deaths, stat.assists) == (6.5, 4.5, 6.5)
    assert stat.cs == 240.0
    # (180 + 300) / (30 + 20) = 9.6。試合ごとの分あたり CS の平均（6.0 と 15.0 → 10.5）とは異なる
    assert stat.csPerMinute == 9.6


def test_aggregate_champion_stats_cs_per_minute_zero_when_no_duration() -> None:
    """試合時間の合計が 0 なら、ゼロ除算せず分あたり CS は 0。"""
    matches = [participation("m1", cs=150, game_duration=0)]

    stat = aggregate_champion_stats(matches)[0]

    assert stat.csPerMinute == 0.0
    assert stat.cs == 150.0


def test_by_queue_splits_solo_flex_and_all() -> None:
    """all はソロ(420)とフレックス(440)の両方、solo は 420、flex は 440 だけで集計する。"""
    matches = [
        participation("m1", queue_id=420, win=True),
        participation("m2", queue_id=420, win=False),
        participation("m3", queue_id=440, win=True),
        participation("m4", queue_id=440, champion_name="Zed", win=True),
    ]

    result = aggregate_champion_stats_by_queue(matches)

    by_name = {s.championName: s for s in result.all}
    assert (by_name["Ahri"].wins, by_name["Ahri"].losses) == (2, 1)
    assert (by_name["Zed"].wins, by_name["Zed"].losses) == (1, 0)
    assert [(s.championName, s.wins, s.losses) for s in result.solo] == [("Ahri", 1, 1)]
    assert sorted((s.championName, s.wins) for s in result.flex) == [
        ("Ahri", 1),
        ("Zed", 1),
    ]


def test_by_queue_each_list_is_sorted_by_games_descending() -> None:
    """各リストは試合数の降順に並ぶ。"""
    matches = [
        participation("m1", queue_id=420, champion_name="Zed"),
        participation("m2", queue_id=420, champion_name="Ahri"),
        participation("m3", queue_id=420, champion_name="Ahri"),
        participation("m4", queue_id=440, champion_name="Ahri"),
        participation("m5", queue_id=440, champion_name="Zed"),
    ]

    result = aggregate_champion_stats_by_queue(matches)

    assert [s.championName for s in result.all] == ["Ahri", "Zed"]
    assert [s.championName for s in result.solo] == ["Ahri", "Zed"]
    assert [s.championName for s in result.flex] == ["Ahri", "Zed"]


def test_by_queue_ignores_other_queues() -> None:
    """ランク戦以外のキュー（例: 450 ARAM）はどの集計にも含めない。"""
    result = aggregate_champion_stats_by_queue([participation("m1", queue_id=450)])

    assert result.all == []
    assert result.solo == []
    assert result.flex == []


def test_by_queue_empty() -> None:
    """試合がなければ3つとも空。"""
    result = aggregate_champion_stats_by_queue([])

    assert (result.all, result.solo, result.flex) == ([], [], [])


def test_by_queue_excludes_remakes() -> None:
    """リメイク（早期降伏）の試合は、全体・ソロ・フレックスのどれにも数えない。"""
    matches = [
        participation("m1", queue_id=420, win=True),
        participation("m2", queue_id=420, win=False, is_remake=True),
        participation("m3", queue_id=440, win=False, is_remake=True),
    ]

    result = aggregate_champion_stats_by_queue(matches)

    assert [(s.wins, s.losses) for s in result.all] == [(1, 0)]
    assert [(s.wins, s.losses) for s in result.solo] == [(1, 0)]
    assert result.flex == []
