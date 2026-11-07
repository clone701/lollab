"""detail.py のユニットテスト（Summoner_Store はモック）。

DB のデータから SummonerDetail を組み立てる処理（ランク順位、試合履歴、
チャンピオン統計の集計期間）を確認する。

_Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 7.1〜7.4_
"""

import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any
from unittest.mock import AsyncMock, patch

from tests.sync_helpers import install_store_stub

# adapters の各ストアは import 時に Supabase クライアントを作るため、
# 環境変数なしでもインポートできるようにスタブを注入する
install_store_stub()

from schemas.match_detail import RankBrief  # noqa: E402
from schemas.summoner_store import (  # noqa: E402
    MatchMemberRecord,
    ParticipationRecord,
    SeasonRecord,
    SummonerRecord,
)
from services.summoner.detail import build_detail  # noqa: E402
from tests.participation_helpers import member, participation  # noqa: E402

_RECENT = "services.summoner.detail.summoner_store.get_recent_participations"
_BETWEEN = "services.summoner.detail.summoner_store.get_participations_between"
_SEASON = "services.summoner.detail.summoner_store.get_current_season"
_YEAR_START = "services.summoner.stats_period.season_store.get_earliest_start_at"
_MEMBERS = "services.summoner.match_card.match_member_store.get_members_by_match"
_RANKS = "services.summoner.match_card.match_rank_store.get_ranks"
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
    **overrides: Any,
) -> ParticipationRecord:
    """ParticipationRecord を生成する（試合終了は現在から ended_ago 前）。"""
    return participation(
        match_id, ended_ago=ended_ago, champion_name=champion, win=win, **overrides
    )


def _build(
    record: SummonerRecord,
    recent: list[ParticipationRecord] | None = None,
    between: list[ParticipationRecord] | None = None,
    season: SeasonRecord | None = None,
    members: dict[str, list[MatchMemberRecord]] | None = None,
    ranks: dict[str, RankBrief] | None = None,
    year_start: datetime | None = None,  # 同じ年で最も早いシーズンの start_at
) -> tuple:  # type: ignore[type-arg]
    """build_detail を実行し、(結果, recent モック, between モック) を返す。"""
    mock_recent = AsyncMock(return_value=recent or [])
    mock_between = AsyncMock(return_value=between or [])
    with (
        patch(_RECENT, new=mock_recent),
        patch(_BETWEEN, new=mock_between),
        patch(_SEASON, new=AsyncMock(return_value=season)),
        patch(_YEAR_START, new=AsyncMock(return_value=year_start)),
        patch(_MEMBERS, new=AsyncMock(return_value=members or {})),
        patch(_RANKS, new=AsyncMock(return_value=ranks or {})),
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
    assert summoner.puuid == "puuid-0"
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


def test_build_detail_matches_have_card_fields() -> None:
    """試合カードの項目（キュー・スペル・ルーン・参加者・キル関与率・試合のランク）を作る。"""
    recent = [participation("JP1_1", kills=5, assists=8)]
    members = {
        "JP1_1": [
            member(puuid="enemy", team_id=200, team_position="TOP", kills=7),
            member(puuid="puuid-0", team_id=100, kills=5),
            member(puuid="ally", team_id=100, team_position="TOP", kills=15),
        ]
    }
    ranks = {
        "puuid-0": RankBrief(tier="GOLD", division="IV"),
        "ally": RankBrief(tier="GOLD", division="II"),
    }

    detail, _, _ = _build(_record(), recent=recent, members=members, ranks=ranks)

    card = detail.matches[0]
    assert card.queueId == 420
    assert card.spellIds == [4, 14]
    assert (card.keystoneId, card.subStyleId) == (8112, 8200)
    assert [p.puuid for p in card.participants] == ["ally", "puuid-0", "enemy"]
    # (5 + 8) / (5 + 15) = 0.65。敵チームのキルは含めない
    assert card.killParticipation == 0.65
    assert card.averageRank is not None
    assert (card.averageRank.tier, card.averageRank.division) == ("GOLD", "III")


def test_build_detail_champion_stats_start_from_year_of_current_season() -> None:
    """チャンピオン統計は、現行シーズンと同じ年の最初のシーズンの開始から集計する。"""
    season = SeasonRecord(
        id="2025-S3",
        name="2025 Season 3",
        start_at=datetime(2025, 9, 1, tzinfo=timezone.utc),
        end_at=None,
    )
    year_start = datetime(2025, 1, 9, tzinfo=timezone.utc)
    between = [
        _participation("JP1_1", champion="Zed", cs=100),
        _participation("JP1_2", champion="Ahri", win=True, cs=200),
        _participation("JP1_3", champion="Ahri", win=False, cs=100),
        _participation("JP1_4", champion="Ahri", queue_id=440, cs=300),
    ]

    detail, _, mock_between = _build(
        _record(), between=between, season=season, year_start=year_start
    )

    mock_between.assert_awaited_once_with("puuid-0", year_start, None)
    stats = detail.championStats
    assert [s.championName for s in stats.all] == ["Ahri", "Zed"]
    ahri = stats.all[0]
    assert (ahri.wins, ahri.losses) == (2, 1)
    assert ahri.cs == 200.0
    assert [s.championName for s in stats.solo] == ["Ahri", "Zed"]
    assert [(s.championName, s.wins) for s in stats.flex] == [("Ahri", 1)]
    assert detail.championStatsYear == 2025


def test_build_detail_champion_stats_all_time_without_season() -> None:
    """現行シーズンが未登録なら全期間（start / end とも None）で集計する。"""
    detail, _, mock_between = _build(_record(), season=None)

    mock_between.assert_awaited_once_with("puuid-0", None, None)
    assert detail.championStatsYear is None


def test_build_detail_champion_stats_year_none_when_id_has_no_year() -> None:
    """年が取れない id の現行シーズンなら、championStatsYear は None。"""
    season = SeasonRecord(
        id="preseason",
        name="preseason",
        start_at=datetime(2025, 9, 1, tzinfo=timezone.utc),
        end_at=None,
    )

    detail, _, _ = _build(_record(), season=season)

    assert detail.championStatsYear is None


def test_build_detail_empty_history() -> None:
    """試合がなければ、試合履歴・チャンピオン統計とも空。"""
    detail, _, _ = _build(_record())

    stats = detail.championStats
    assert (detail.matches, stats.all, stats.solo, stats.flex) == ([], [], [], [])
