"""riot_fetch.fetch_match_details のユニットテスト（Riot API はモック）。

試合詳細から ParticipantRecord への変換、429 の伝播、個別失敗のスキップ、
同時実行数の制限を確認する。

_Requirements: 3.2, 3.3, 4.1, 6.3_
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any
from unittest.mock import AsyncMock, patch

import httpx
import pytest

from services.summoner.riot_fetch import RiotRateLimitError, fetch_match_details
from tests.riot_fetch_helpers import (
    GAME_END_MS,
    GET,
    is_timeline_path,
    match_detail,
    match_id_of,
    status_error,
    timeline_detail,
)

# fetch_match_details: 変換
# ---------------------------------------------------------------------------


def test_fetch_match_details_converts_to_records() -> None:
    """試合詳細から MatchRecord 1件と ParticipantRecord 10件に変換する。"""

    async def fake_get(
        host: str, path: str, params: Any = None, priority: str = "interactive"
    ) -> Any:
        if is_timeline_path(path):
            return timeline_detail()
        assert host == "asia"
        return match_detail(match_id_of(path))

    with patch(GET, new=fake_get):
        result = asyncio.run(fetch_match_details("JP", ["JP1_1"]))

    assert len(result.fetched) == 1
    match = result.fetched[0].match
    expected_end = datetime.fromtimestamp(GAME_END_MS / 1000, tz=timezone.utc)
    assert match.match_id == "JP1_1"
    assert match.queue_id == 420
    assert match.game_mode == "CLASSIC"
    assert match.game_version == "15.10.678.1234"
    assert match.game_duration == 1800
    assert match.game_end_at == expected_end

    participants = result.fetched[0].participants
    assert len(participants) == 10

    p = participants[0]
    assert p.match_id == "JP1_1"
    assert p.puuid == "puuid-0"
    assert p.riot_id_game_name == "Name0"
    assert p.riot_id_tagline == "T0"
    assert p.team_id == 100
    assert p.team_position == "MIDDLE"
    assert p.champion_id == 103
    assert p.champion_name == "Champ0"
    assert p.win is True
    assert (p.kills, p.deaths, p.assists) == (5, 2, 8)
    assert p.cs == 160  # totalMinionsKilled + neutralMinionsKilled
    assert p.gold_earned == 12345
    assert p.damage_to_champions == 23456
    assert p.vision_score == 31
    assert p.item_ids == [3157, 3089, 3135, 3020, 3165, 3040, 3363]
    assert (p.spell1_id, p.spell2_id) == (4, 14)
    assert p.keystone_id == 8112
    assert (p.primary_style_id, p.sub_style_id) == (8100, 8200)
    assert p.queue_id == 420
    assert p.game_end_at == expected_end

    # チーム・勝敗は参加者ごとに異なる
    assert participants[9].team_id == 200
    assert participants[9].win is False


def test_fetch_match_details_missing_team_position_is_empty_string() -> None:
    """teamPosition が空または無い場合は空文字にする。"""
    detail = match_detail()
    del detail["info"]["participants"][1]["teamPosition"]

    with patch(GET, new=AsyncMock(return_value=detail)):
        result = asyncio.run(fetch_match_details("JP", ["JP1_1"]))

    assert result.fetched[0].participants[1].team_position == ""


def test_fetch_match_details_empty_ids_makes_no_request() -> None:
    """ID が空なら Riot API を呼ばない。"""
    mock_get = AsyncMock()
    with patch(GET, new=mock_get):
        result = asyncio.run(fetch_match_details("JP", []))

    assert result.fetched == [] and result.failures == []
    mock_get.assert_not_called()


# ---------------------------------------------------------------------------
# fetch_match_details: 429 の伝播
# ---------------------------------------------------------------------------


def test_fetch_match_details_propagates_429_with_fetched_matches() -> None:
    """429 は RiotRateLimitError として伝わり、取得済みの試合が fetched に入る。

    429 以降に未開始のリクエストは送らない。
    """
    requested: list[str] = []

    async def fake_get(
        host: str, path: str, params: Any = None, priority: str = "interactive"
    ) -> Any:
        if is_timeline_path(path):
            return timeline_detail()
        match_id = match_id_of(path)
        requested.append(match_id)
        if match_id == "JP1_2":
            raise status_error(429)
        return match_detail(match_id)

    with patch(GET, new=fake_get):
        with pytest.raises(RiotRateLimitError) as exc_info:
            asyncio.run(fetch_match_details("JP", ["JP1_1", "JP1_2", "JP1_3"]))

    error = exc_info.value
    assert isinstance(error, httpx.HTTPStatusError)
    assert error.response.status_code == 429
    assert [m.match.match_id for m in error.fetched] == ["JP1_1"]
    assert error.failures == []
    assert requested == ["JP1_1", "JP1_2"]


# ---------------------------------------------------------------------------
# fetch_match_details: 個別失敗のスキップ
# ---------------------------------------------------------------------------


def test_fetch_match_details_skips_individual_failures(
    caplog: pytest.LogCaptureFixture,
) -> None:
    """HTTP エラー（429 以外）と変換エラーの試合はログに記録してスキップする。"""

    async def fake_get(
        host: str, path: str, params: Any = None, priority: str = "interactive"
    ) -> Any:
        if is_timeline_path(path):
            return timeline_detail()
        match_id = match_id_of(path)
        if match_id == "JP1_1":
            raise status_error(500)
        if match_id == "JP1_2":
            return {"metadata": {"matchId": match_id}}  # info が無い不正な形式
        return match_detail(match_id)

    with patch(GET, new=fake_get):
        with caplog.at_level(logging.WARNING, logger="services.summoner.riot_fetch"):
            result = asyncio.run(fetch_match_details("JP", ["JP1_1", "JP1_2", "JP1_3"]))

    assert [m.match.match_id for m in result.fetched] == ["JP1_3"]
    assert {f.match_id: f.error for f in result.failures} == {
        "JP1_1": "HTTP 500",
        "JP1_2": "KeyError",
    }
    warnings = [r for r in caplog.records if r.levelno == logging.WARNING]
    assert len(warnings) == 2


def test_fetch_match_details_limits_concurrency_to_10() -> None:
    """同時リクエスト数は 10 を超えない。"""
    in_flight = 0
    max_in_flight = 0

    async def fake_get(
        host: str, path: str, params: Any = None, priority: str = "interactive"
    ) -> Any:
        if is_timeline_path(path):
            return timeline_detail()
        nonlocal in_flight, max_in_flight
        in_flight += 1
        max_in_flight = max(max_in_flight, in_flight)
        await asyncio.sleep(0)
        in_flight -= 1
        return match_detail(match_id_of(path))

    match_ids = [f"JP1_{i}" for i in range(25)]
    with patch(GET, new=fake_get):
        result = asyncio.run(fetch_match_details("JP", match_ids))

    assert [m.match.match_id for m in result.fetched] == match_ids
    assert max_in_flight == 10
