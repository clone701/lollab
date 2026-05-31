"""profile.py のユニットテスト。

ランクデータなし時の UNRANKED デフォルト値と、
404/429/5xx エラーの HTTPException 変換を確認する。

_Requirements: 4.5, 3.2, 3.3, 3.4_
"""

import asyncio
import sys
from types import ModuleType
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest
from fastapi import HTTPException

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

from services.summoner.profile import get_summoner_data  # noqa: E402

# ---------------------------------------------------------------------------
# ヘルパー
# ---------------------------------------------------------------------------


def _make_http_status_error(status_code: int) -> httpx.HTTPStatusError:
    """指定ステータスコードの httpx.HTTPStatusError を生成する。"""
    mock_response = MagicMock()
    mock_response.status_code = status_code
    return httpx.HTTPStatusError("error", request=MagicMock(), response=mock_response)


# ---------------------------------------------------------------------------
# テスト
# ---------------------------------------------------------------------------


def test_get_summoner_data_unranked_default() -> None:
    """ランクエントリーが空のとき、SummonerData.rank は UNRANKED デフォルト値を返す。

    _Requirements: 4.5_
    """
    account_data = {"puuid": "test-puuid", "gameName": "TestUser", "tagLine": "JP1"}
    summoner_data = {
        "id": "summoner-id",
        "name": "TestUser",
        "profileIconId": 1,
        "summonerLevel": 100,
    }
    league_entries: list = []

    mock_get = AsyncMock(side_effect=[account_data, summoner_data, league_entries])

    with patch("services.summoner.profile.riot_api.get", mock_get):
        result = asyncio.run(get_summoner_data("JP", "TestUser", "JP1"))

    assert result.rank.tier == "UNRANKED"
    assert result.rank.rank == ""
    assert result.rank.leaguePoints == 0
    assert result.rank.wins == 0
    assert result.rank.losses == 0


def test_get_summoner_data_404_raises_http_404() -> None:
    """riot_api.get が 404 を返したとき、HTTPException(404) が発生する。

    _Requirements: 3.2_
    """
    mock_get = AsyncMock(side_effect=_make_http_status_error(404))

    with patch("services.summoner.profile.riot_api.get", mock_get):
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(get_summoner_data("JP", "TestUser", "JP1"))

    assert exc_info.value.status_code == 404


def test_get_summoner_data_429_raises_http_429() -> None:
    """riot_api.get が 429 を返したとき、HTTPException(429) が発生する。

    _Requirements: 3.3_
    """
    mock_get = AsyncMock(side_effect=_make_http_status_error(429))

    with patch("services.summoner.profile.riot_api.get", mock_get):
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(get_summoner_data("JP", "TestUser", "JP1"))

    assert exc_info.value.status_code == 429


def test_get_summoner_data_5xx_raises_http_502() -> None:
    """riot_api.get が 500 を返したとき、HTTPException(502) が発生する。

    _Requirements: 3.4_
    """
    mock_get = AsyncMock(side_effect=_make_http_status_error(500))

    with patch("services.summoner.profile.riot_api.get", mock_get):
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(get_summoner_data("JP", "TestUser", "JP1"))

    assert exc_info.value.status_code == 502
