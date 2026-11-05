"""detail.py のユニットテスト（Summoner_Store はモック）。

DB のデータから SummonerDetail を組み立てる処理（ランク順位、試合履歴、
チャンピオン統計の集計期間）を確認する。

_Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 7.1〜7.4_
"""

import asyncio
import sys
from datetime import datetime, timedelta, timezone
from types import ModuleType
from unittest.mock import AsyncMock, patch

# adapters.summoner_store は import 時に Supabase クライアントを作るため、
# 環境変数なしでもインポートできるようにスタブを注入する
_fake_store = ModuleType("adapters.summoner_store")
for _name in (
    "get_recent_participations",
    "get_participations_between",
    "get_current_season",
):
    setattr(_fake_store, _name, AsyncMock())
sys.modules.setdefault("adapters.summoner_store", _fake_store)

from schemas.summoner_store import (  # noqa: E402
    ParticipationRecord,
    SeasonRecord,
    SummonerRecord,
)
from services.summoner.detail import build_detail  # noqa: E402

_RECENT = "services.summoner.detail.summoner_store.get_recent_participations"
_BETWEEN = "services.summoner.detail.summoner_store.get_participations_between"
_SEASON = "services.summoner.detail.summoner_store.get_current_season"

_UPDATED_AT = datetime(2025, 3, 1, 12, 0, tzinfo=timezone.utc)

# ---------------------------------------------------------------------------
# ヘルパー
# ---------------------------------------------------------------------------


def _record(**overrides: object) -> SummonerRecord:
    """ランク付きの SummonerRecord を生成する。"""
    fields: dict[str, object] = {
        "puuid": "puuid-0",
        "region": "JP",
        "game_name": "TestUser",
        "tag_line": "JP1",
        "riot_id_lower": "testuser#jp1",
        "level": 100,
        "profile_icon_id": 7,
        "solo_tier": "GOLD",
        "solo_rank": "II",
        "solo_lp": 50,
        "solo_wins": 10,
        "solo_losses": 5,
        "rank_position": 12,
        "rank_total": 300,
        "rank_top_percent": 45.5,
        "last_updated_at": _UPDATED_AT,
    }
    fields.update(overrides)
    return SummonerRecord.model_validate(fields)


def _participation(
    match_id: str,
    champion: str = "Ahri",
    win: bool = True,
    ended_ago: timedelta = timedelta(hours=1),
    kills: int = 5,
    deaths: int = 2,
    assists: int = 8,
    cs: int = 180,
) -> ParticipationRecord:
    """ParticipationRecord を生成する（試合終了は現在から ended_ago 前）。"""
    return ParticipationRecord(
        match_id=match_id,
        puuid="puuid-0",
        team_id=100,
        team_position="MIDDLE",
        champion_id=103,
        champion_name=champion,
        win=win,
        kills=kills,
        deaths=deaths,
        assists=assists,
        cs=cs,
        gold_earned=10000,
        damage_to_champions=20000,
        vision_score=20,
        item_ids=[3157, 3089, 0, 0, 0, 0, 3363],
        spell1_id=4,
        spell2_id=14,
        keystone_id=8112,
        primary_style_id=8100,
        sub_style_id=8200,
        queue_id=420,
        game_end_at=datetime.now(timezone.utc) - ended_ago,
        game_mode="CLASSIC",
        game_duration=1800,
    )


def _build(
    record: SummonerRecord,
    recent: list[ParticipationRecord] | None = None,
    between: list[ParticipationRecord] | None = None,
    season: SeasonRecord | None = None,
) -> tuple:  # type: ignore[type-arg]
    """build_detail を実行し、(結果, recent モック, between モック) を返す。"""
    mock_recent = AsyncMock(return_value=recent or [])
    mock_between = AsyncMock(return_value=between or [])
    with (
        patch(_RECENT, new=mock_recent),
        patch(_BETWEEN, new=mock_between),
        patch(_SEASON, new=AsyncMock(return_value=season)),
    ):
        detail = asyncio.run(build_detail(record))
    return detail, mock_recent, mock_between


# ---------------------------------------------------------------------------
# テスト
# ---------------------------------------------------------------------------


def test_build_detail_maps_summoner_and_rank() -> None:
    """summoners の行からプロフィール・ソロランク・最終更新日時を組み立てる。"""
    detail, _, _ = _build(_record())

    summoner = detail.summoner
    assert summoner.name == "TestUser"
    assert summoner.tagLine == "JP1"
    assert summoner.level == 100
    assert summoner.profileIconId == 7
    assert summoner.lastUpdatedAt == _UPDATED_AT
    assert summoner.rank.queueType == "RANKED_SOLO_5x5"
    assert summoner.rank.tier == "GOLD"
    assert summoner.rank.rank == "II"
    assert summoner.rank.leaguePoints == 50
    assert (summoner.rank.wins, summoner.rank.losses) == (10, 5)


def test_build_detail_rank_position() -> None:
    """順位・人数・上位%を rankPosition にする。"""
    detail, _, _ = _build(_record())

    assert detail.rankPosition is not None
    assert detail.rankPosition.position == 12
    assert detail.rankPosition.totalPlayers == 300
    assert detail.rankPosition.topPercent == 45.5


def test_build_detail_rank_position_none_for_unranked() -> None:
    """UNRANKED の場合、rankPosition は None。"""
    record = _record(solo_tier="UNRANKED", solo_rank="", rank_top_percent=10.0)

    detail, _, _ = _build(record)

    assert detail.rankPosition is None


def test_build_detail_rank_position_none_when_top_percent_is_null() -> None:
    """rank_top_percent が NULL の場合、rankPosition は None。"""
    detail, _, _ = _build(_record(rank_top_percent=None))

    assert detail.rankPosition is None


def test_build_detail_unknown_position_is_zero() -> None:
    """順位・人数が NULL でも上位%があれば、0（不明）として返す。"""
    detail, _, _ = _build(_record(rank_position=None, rank_total=None))

    assert detail.rankPosition is not None
    assert detail.rankPosition.position == 0
    assert detail.rankPosition.totalPlayers == 0
    assert detail.rankPosition.topPercent == 45.5


def test_build_detail_matches_from_recent_participations() -> None:
    """試合履歴は直近20件の参加記録から作り、timeAgoSeconds は現在との差にする。"""
    recent = [
        _participation("JP1_2", champion="Zed", win=False, kills=1, deaths=7),
        _participation("JP1_1", ended_ago=timedelta(days=1)),
    ]

    detail, mock_recent, _ = _build(_record(), recent=recent)

    mock_recent.assert_awaited_once_with("puuid-0", 20)
    assert [m.matchId for m in detail.matches] == ["JP1_2", "JP1_1"]
    first = detail.matches[0]
    assert first.isWin is False
    assert first.gameMode == "CLASSIC"
    assert first.championName == "Zed"
    assert (first.kills, first.deaths, first.assists) == (1, 7, 8)
    assert first.cs == 180
    assert first.gameDurationSeconds == 1800
    assert first.itemIds == [3157, 3089, 0, 0, 0, 0, 3363]
    assert abs(first.timeAgoSeconds - 3600) < 5
    assert abs(detail.matches[1].timeAgoSeconds - 86400) < 5


def test_build_detail_champion_stats_use_current_season_period() -> None:
    """チャンピオン統計は現行シーズンの期間で集計し、総試合数の降順に並べる。"""
    season = SeasonRecord(
        id="2025-S1",
        name="2025 Season 1",
        start_at=datetime(2025, 1, 9, tzinfo=timezone.utc),
        end_at=None,
    )
    between = [
        _participation("JP1_1", champion="Zed", cs=100, kills=4, deaths=2, assists=2),
        _participation("JP1_2", champion="Ahri", win=True, cs=200),
        _participation("JP1_3", champion="Ahri", win=False, cs=100),
    ]

    detail, _, mock_between = _build(_record(), between=between, season=season)

    mock_between.assert_awaited_once_with("puuid-0", season.start_at, None)
    assert [s.championName for s in detail.championStats] == ["Ahri", "Zed"]
    ahri = detail.championStats[0]
    assert (ahri.wins, ahri.losses) == (1, 1)
    assert ahri.cs == 150.0
    assert ahri.kda == (5 + 8 + 5 + 8) / (2 + 2)


def test_build_detail_champion_stats_all_time_without_season() -> None:
    """現行シーズンが未登録なら全期間（start / end とも None）で集計する。"""
    _, _, mock_between = _build(_record(), season=None)

    mock_between.assert_awaited_once_with("puuid-0", None, None)


def test_build_detail_empty_history() -> None:
    """試合がなければ、試合履歴・チャンピオン統計とも空。"""
    detail, _, _ = _build(_record())

    assert detail.matches == []
    assert detail.championStats == []
