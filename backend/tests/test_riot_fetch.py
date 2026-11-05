"""riot_fetch の試合ID一覧・アカウント・プロフィール取得のユニットテスト。

_Requirements: 3.2, 3.3_
"""

import asyncio
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

import httpx
import pytest
from fastapi import HTTPException

from services.summoner.rank_position import RankPositionResult
from services.summoner.riot_fetch import (
    RiotRateLimitError,
    fetch_account_by_riot_id,
    fetch_profile,
    fetch_ranked_match_ids,
)
from tests.riot_fetch_helpers import GET, status_error

# --- fetch_ranked_match_ids ---


def test_fetch_ranked_match_ids_passes_query_params() -> None:
    """type=ranked と start / count / startTime / endTime（epoch 秒）を渡す。"""
    mock_get = AsyncMock(return_value=["JP1_1", "JP1_2"])
    start_time = datetime(2025, 1, 1, tzinfo=timezone.utc)
    end_time = datetime(2025, 2, 1, tzinfo=timezone.utc)

    with patch(GET, new=mock_get):
        result = asyncio.run(
            fetch_ranked_match_ids(
                "JP",
                "puuid-0",
                start=100,
                count=100,
                start_time=start_time,
                end_time=end_time,
            )
        )

    assert result == ["JP1_1", "JP1_2"]
    mock_get.assert_awaited_once_with(
        "asia",
        "/lol/match/v5/matches/by-puuid/puuid-0/ids",
        params={
            "type": "ranked",
            "start": 100,
            "count": 100,
            "startTime": int(start_time.timestamp()),
            "endTime": int(end_time.timestamp()),
        },
        priority="interactive",
    )


def test_fetch_ranked_match_ids_omits_time_params_by_default() -> None:
    """startTime / endTime を指定しなければクエリに含めない。"""
    mock_get = AsyncMock(return_value=[])

    with patch(GET, new=mock_get):
        asyncio.run(fetch_ranked_match_ids("NA", "puuid-0", start=0, count=20))

    assert mock_get.await_args is not None
    assert mock_get.await_args.args[0] == "americas"
    assert mock_get.await_args.kwargs["params"] == {
        "type": "ranked",
        "start": 0,
        "count": 20,
    }


@pytest.mark.parametrize("count", [0, 101, -1])
def test_fetch_ranked_match_ids_rejects_invalid_count(count: int) -> None:
    """count が 1〜100 の範囲外なら Riot API を呼ばずに ValueError にする。"""
    mock_get = AsyncMock()

    with patch(GET, new=mock_get):
        with pytest.raises(ValueError):
            asyncio.run(fetch_ranked_match_ids("JP", "p", start=0, count=count))

    mock_get.assert_not_called()


def test_fetch_ranked_match_ids_429_raises_rate_limit_error() -> None:
    """429 は RiotRateLimitError として伝わる。"""
    with patch(GET, new=AsyncMock(side_effect=status_error(429))):
        with pytest.raises(RiotRateLimitError):
            asyncio.run(fetch_ranked_match_ids("JP", "p", start=0, count=20))


def test_fetch_ranked_match_ids_5xx_propagates_http_status_error() -> None:
    """429 以外の HTTP エラーは RiotRateLimitError にせず伝える。"""
    with patch(GET, new=AsyncMock(side_effect=status_error(500))):
        with pytest.raises(httpx.HTTPStatusError) as exc_info:
            asyncio.run(fetch_ranked_match_ids("JP", "p", start=0, count=20))

    assert not isinstance(exc_info.value, RiotRateLimitError)


# ---------------------------------------------------------------------------
# fetch_account_by_riot_id / fetch_profile
# ---------------------------------------------------------------------------


def test_fetch_account_by_riot_id_encodes_path_and_returns_account() -> None:
    """ゲーム名・タグラインは URL エンコードして渡す。"""
    account = {"puuid": "puuid-0", "gameName": "Hide on bush", "tagLine": "KR1"}
    mock_get = AsyncMock(return_value=account)

    with patch(GET, new=mock_get):
        result = asyncio.run(fetch_account_by_riot_id("KR", "Hide on bush", "KR1"))

    assert (result.puuid, result.game_name, result.tag_line) == (
        "puuid-0",
        "Hide on bush",
        "KR1",
    )
    mock_get.assert_awaited_once_with(
        "asia", "/riot/account/v1/accounts/by-riot-id/Hide%20on%20bush/KR1"
    )


def test_fetch_account_by_riot_id_404_raises_http_404() -> None:
    """アカウント未発見は HTTPException(404) に変換する。"""
    with patch(GET, new=AsyncMock(side_effect=status_error(404))):
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(fetch_account_by_riot_id("JP", "x", "y"))

    assert exc_info.value.status_code == 404


@pytest.mark.parametrize("error_type", [httpx.ConnectError, httpx.ReadTimeout])
def test_fetch_profile_request_error_raises_http_502(
    error_type: type[httpx.RequestError],
) -> None:
    """接続エラー・タイムアウトは HTTPException(502) に変換する。"""
    with patch(GET, new=AsyncMock(side_effect=error_type("boom"))):
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(fetch_profile("JP", "puuid-0"))

    assert exc_info.value.status_code == 502


def test_fetch_profile_rank_position_request_error_raises_http_502() -> None:
    """ランク順位取得中の接続エラーも 502 に変換する。"""
    mock_get = AsyncMock(
        side_effect=[{"summonerLevel": 100, "profileIconId": 1}, [_SOLO_ENTRY]],
    )
    mock_position = AsyncMock(side_effect=httpx.ConnectError("boom"))

    with (
        patch(GET, new=mock_get),
        patch("services.summoner.riot_fetch.get_rank_position", new=mock_position),
    ):
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(fetch_profile("JP", "puuid-0"))

    assert exc_info.value.status_code == 502


def test_fetch_ranked_match_ids_request_error_propagates() -> None:
    """試合ID一覧の接続エラーは変換せず伝える（sync / Backfill が扱う）。"""
    with patch(GET, new=AsyncMock(side_effect=httpx.ConnectError("boom"))):
        with pytest.raises(httpx.ConnectError):
            asyncio.run(fetch_ranked_match_ids("JP", "p", start=0, count=20))


def test_fetch_profile_unranked_skips_rank_position_request() -> None:
    """ソロランクが無ければ UNRANKED を返し、順位取得の API を呼ばない。"""
    mock_get = AsyncMock(
        side_effect=[{"summonerLevel": 30, "profileIconId": 10}, []],
    )

    with patch(GET, new=mock_get):
        result = asyncio.run(fetch_profile("JP", "puuid-0"))

    assert mock_get.await_count == 2
    assert result.level == 30
    assert result.profile_icon_id == 10
    assert result.rank.tier == "UNRANKED"
    assert result.rank.rank == ""
    assert result.rank_position is None
    assert result.rank_total is None
    assert result.rank_top_percent is None


_SOLO_ENTRY = {
    "queueType": "RANKED_SOLO_5x5",
    "tier": "GOLD",
    "rank": "II",
    "leaguePoints": 50,
    "wins": 10,
    "losses": 5,
    "summonerId": "sid-1",
}


def test_fetch_profile_ranked_uses_rank_position() -> None:
    """ランクありなら get_rank_position の結果を順位として返す。"""
    mock_get = AsyncMock(
        side_effect=[
            {"summonerLevel": 100, "profileIconId": 1},
            [{"queueType": "RANKED_FLEX_SR", "tier": "IRON"}, _SOLO_ENTRY],
        ],
    )
    mock_position = AsyncMock(return_value=RankPositionResult(5, 100, 12.5))

    with (
        patch(GET, new=mock_get),
        patch("services.summoner.riot_fetch.get_rank_position", new=mock_position),
    ):
        result = asyncio.run(fetch_profile("JP", "puuid-0"))

    assert mock_position.await_args is not None
    region_arg, rank_arg = mock_position.await_args.args
    assert region_arg == "JP"
    assert mock_position.await_args.kwargs == {
        "puuid": "puuid-0",
        "summoner_id": "sid-1",
    }
    assert rank_arg.tier == "GOLD"
    assert (result.rank.tier, result.rank.rank, result.rank.leaguePoints) == (
        "GOLD",
        "II",
        50,
    )
    assert (result.rank.wins, result.rank.losses) == (10, 5)
    assert result.rank_position == 5
    assert result.rank_total == 100
    assert result.rank_top_percent == 12.5


def test_fetch_profile_unknown_position_is_none() -> None:
    """順位が不明（0）の場合は None にし、上位%は保持する。"""
    mock_get = AsyncMock(
        side_effect=[{"summonerLevel": 100, "profileIconId": 1}, [_SOLO_ENTRY]],
    )
    mock_position = AsyncMock(return_value=RankPositionResult(0, 0, 40.0))

    with (
        patch(GET, new=mock_get),
        patch("services.summoner.riot_fetch.get_rank_position", new=mock_position),
    ):
        result = asyncio.run(fetch_profile("JP", "puuid-0"))

    assert result.rank_position is None
    assert result.rank_total is None
    assert result.rank_top_percent == 40.0
