"""rank_position.get_rank_position のユニットテスト: エントリの照合。"""

import asyncio
from typing import Any
from unittest.mock import AsyncMock, patch

from schemas.summoner import RankData
from services.summoner.rank_position import get_rank_position

GET = "services.summoner.rank_position.riot_api.get"


def _rank(tier: str, division: str) -> RankData:
    return RankData(
        queueType="RANKED_SOLO_5x5",
        tier=tier,
        rank=division,
        leaguePoints=50,
        wins=10,
        losses=5,
    )


def _entries() -> list[dict[str, Any]]:
    """LP 降順で puuid-b が2位。summonerId は league-v4 に含まれない想定。"""
    return [
        {"puuid": "puuid-a", "leaguePoints": 90},
        {"puuid": "puuid-b", "leaguePoints": 80},
        {"puuid": "puuid-c", "leaguePoints": 10},
    ]


def test_division_position_matches_by_puuid() -> None:
    """Diamond 以下: puuid が一致するエントリの順位を返す。"""
    with patch(GET, new=AsyncMock(return_value=_entries())):
        result = asyncio.run(get_rank_position("JP", _rank("GOLD", "II"), "puuid-b"))

    assert result is not None
    assert (result.position, result.total_in_tier) == (2, 3)


def test_apex_position_matches_by_puuid() -> None:
    """Master 以上: puuid が一致するエントリの順位を返す。"""
    league = {"entries": _entries()}
    with patch(GET, new=AsyncMock(return_value=league)):
        result = asyncio.run(get_rank_position("JP", _rank("MASTER", "I"), "puuid-c"))

    assert result is not None
    assert (result.position, result.total_in_tier) == (3, 3)


def test_puuid_takes_priority_over_summoner_id() -> None:
    """puuid があれば、summonerId が別のエントリに一致しても puuid を優先する。"""
    entries = [
        {"puuid": "puuid-a", "summonerId": "sid-x", "leaguePoints": 90},
        {"puuid": "puuid-b", "summonerId": "sid-y", "leaguePoints": 80},
    ]
    with patch(GET, new=AsyncMock(return_value=entries)):
        result = asyncio.run(
            get_rank_position(
                "JP", _rank("GOLD", "II"), puuid="puuid-b", summoner_id="sid-x"
            )
        )

    assert result is not None
    assert result.position == 2


def test_falls_back_to_summoner_id_when_puuid_empty() -> None:
    """puuid が空のときだけ summonerId で照合する。"""
    entries = [
        {"summonerId": "sid-x", "leaguePoints": 90},
        {"summonerId": "sid-y", "leaguePoints": 80},
    ]
    with patch(GET, new=AsyncMock(return_value=entries)):
        result = asyncio.run(
            get_rank_position("JP", _rank("GOLD", "II"), summoner_id="sid-y")
        )

    assert result is not None
    assert result.position == 2
