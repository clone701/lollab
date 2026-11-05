"""riot_fetch のレート制限の扱いと league entries 取得のテスト（Riot API はモック）。

_Requirements: 3.2〜3.4, 9.3, 9.4_
"""

import asyncio
from typing import Any
from unittest.mock import AsyncMock, patch

import httpx
import pytest
from fastapi import HTTPException

from adapters.riot_rate_limiter import RateLimitExceeded
from schemas.summoner import RankData
from services.summoner.rank_position import get_rank_position
from services.summoner.riot_errors import describe_fetch_error
from services.summoner.riot_fetch import (
    RiotRateLimitError,
    fetch_account_by_riot_id,
    fetch_league,
    fetch_match_details,
    fetch_profile,
    fetch_ranked_match_ids,
)
from tests.riot_fetch_helpers import GET, match_detail, match_id_of, status_error

_RATE_LIMIT_DETAIL = "レート制限に達しました。しばらく待ってから再試行してください"

_SOLO = {
    "queueType": "RANKED_SOLO_5x5",
    "tier": "GOLD",
    "rank": "II",
    "leaguePoints": 50,
    "wins": 10,
    "losses": 5,
}
_FLEX = {"queueType": "RANKED_FLEX_SR", "tier": "IRON", "wins": 4, "losses": 3}


# ---------------------------------------------------------------------------
# 送信前のレート制限 → RiotRateLimitError / 429
# ---------------------------------------------------------------------------


def test_match_ids_rate_limit_exceeded_becomes_rate_limit_error() -> None:
    """送信前のレート制限は、429 相当の RiotRateLimitError になる。"""
    with patch(GET, new=AsyncMock(side_effect=RateLimitExceeded("asia"))):
        with pytest.raises(RiotRateLimitError) as exc_info:
            asyncio.run(
                fetch_ranked_match_ids(
                    "JP", "p", start=0, count=20, priority="backfill"
                )
            )

    assert exc_info.value.response.status_code == 429


def test_match_ids_pass_priority_to_riot_api() -> None:
    """priority は riot_api.get にそのまま渡す。"""
    mock_get = AsyncMock(return_value=[])

    with patch(GET, new=mock_get):
        asyncio.run(
            fetch_ranked_match_ids("JP", "p", start=0, count=20, priority="backfill")
        )

    assert mock_get.await_args is not None
    assert mock_get.await_args.kwargs["priority"] == "backfill"


def test_match_details_rate_limit_exceeded_stops_and_keeps_fetched() -> None:
    """送信前のレート制限でも、取得済みの試合と失敗を持つ RiotRateLimitError になる。"""
    requested: list[str] = []

    async def fake_get(
        host: str, path: str, params: Any = None, priority: str = "interactive"
    ) -> Any:
        match_id = match_id_of(path)
        requested.append(match_id)
        assert priority == "backfill"
        if match_id == "JP1_1":
            raise status_error(500)
        if match_id == "JP1_3":
            raise RateLimitExceeded(host)
        return match_detail(match_id)

    ids = ["JP1_0", "JP1_1", "JP1_2", "JP1_3", "JP1_4"]
    with patch(GET, new=fake_get):
        with pytest.raises(RiotRateLimitError) as exc_info:
            asyncio.run(fetch_match_details("JP", ids, priority="backfill"))

    error = exc_info.value
    assert sorted(m.match.match_id for m in error.fetched) == ["JP1_0", "JP1_2"]
    assert [(f.match_id, f.error) for f in error.failures] == [("JP1_1", "HTTP 500")]


def test_account_rate_limit_exceeded_becomes_http_429() -> None:
    """検索・更新（interactive）の送信前のレート制限は 429 の HTTPException。"""
    with patch(GET, new=AsyncMock(side_effect=RateLimitExceeded("asia"))):
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(fetch_account_by_riot_id("JP", "x", "y"))

    assert exc_info.value.status_code == 429
    assert exc_info.value.detail == _RATE_LIMIT_DETAIL


def test_rank_position_rate_limit_exceeded_becomes_http_429() -> None:
    """ランク順位の取得中の送信前のレート制限も 429 の HTTPException。"""
    rank = RankData(
        queueType="RANKED_SOLO_5x5",
        tier="GOLD",
        rank="II",
        leaguePoints=1,
        wins=1,
        losses=1,
    )
    target = "services.summoner.rank_position.riot_api.get"
    with patch(target, new=AsyncMock(side_effect=RateLimitExceeded("jp1"))):
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(get_rank_position("JP", rank, puuid="p"))

    assert exc_info.value.status_code == 429


# ---------------------------------------------------------------------------
# league entries
# ---------------------------------------------------------------------------


def test_fetch_league_sums_solo_and_flex() -> None:
    """ソロとフレックスの勝敗数を取り出し、合計を求める。"""
    with patch(GET, new=AsyncMock(return_value=[_FLEX, _SOLO])):
        league = asyncio.run(fetch_league("JP", "p"))

    assert (league.solo.wins, league.solo.losses) == (10, 5)
    assert (league.flex_wins, league.flex_losses) == (4, 3)
    assert league.total_games == 22


def test_fetch_league_missing_queues_count_as_zero() -> None:
    """エントリがないキューは UNRANKED・勝敗数 0 として扱う。"""
    with patch(GET, new=AsyncMock(return_value=[_SOLO])):
        solo_only = asyncio.run(fetch_league("JP", "p"))
    with patch(GET, new=AsyncMock(return_value=[])):
        empty = asyncio.run(fetch_league("JP", "p"))

    assert (solo_only.flex_wins, solo_only.flex_losses) == (0, 0)
    assert solo_only.total_games == 15
    assert empty.solo.tier == "UNRANKED"
    assert empty.total_games == 0


def test_fetch_profile_with_league_skips_league_request() -> None:
    """league を渡した場合は league-v4 を呼ばず、フレックスの勝敗数を引き継ぐ。"""
    mock_get = AsyncMock(return_value={"summonerLevel": 30, "profileIconId": 10})
    with patch(GET, new=AsyncMock(return_value=[_FLEX])):
        league = asyncio.run(fetch_league("JP", "p"))

    with patch(GET, new=mock_get):
        profile = asyncio.run(fetch_profile("JP", "p", league=league))

    assert mock_get.await_count == 1
    assert "/summoner/v4/" in mock_get.await_args.args[1]  # type: ignore[union-attr]
    assert (profile.flex_wins, profile.flex_losses) == (4, 3)
    assert profile.rank.tier == "UNRANKED"


# ---------------------------------------------------------------------------
# 失敗内容の要約
# ---------------------------------------------------------------------------


def test_describe_fetch_error_has_no_url_key_or_body() -> None:
    """HTTP エラーはステータスコード、その他は型名だけで、メッセージを含めない。"""
    request = httpx.Request("GET", "https://asia.api.riotgames.com/x?api_key=SECRET")
    response = httpx.Response(503, request=request, text="body-secret")
    http_error = httpx.HTTPStatusError(
        "boom SECRET", request=request, response=response
    )

    assert describe_fetch_error(http_error) == "HTTP 503"
    assert describe_fetch_error(KeyError("SECRET")) == "KeyError"
    assert describe_fetch_error(httpx.ReadTimeout("SECRET")) == "ReadTimeout"
