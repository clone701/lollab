"""ルーターインテグレーションテスト: TestClient を使ったエンドポイント E2E フロー確認。

Requirements: 4.1, 5.1, 6.1
"""

import sys
from types import ModuleType
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

# config と adapters を router の import 前にモックする
_mock_settings = MagicMock()
_mock_settings.riot_api_key = "test-key"
_mock_settings.cors_origins = ["http://localhost:3000"]
_mock_config = ModuleType("config")
_mock_config.settings = _mock_settings  # type: ignore[attr-defined]
sys.modules.setdefault("config", _mock_config)
sys.modules.setdefault("adapters", MagicMock())
sys.modules.setdefault("adapters.riot_api", MagicMock())

from api.summoner.router import router  # noqa: E402
from schemas.summoner import (  # noqa: E402
    ChampionStatData,
    MatchData,
    RankData,
    SummonerData,
)

app = FastAPI()
app.include_router(router)
client = TestClient(app)

# --- テスト用モックデータ ---

_mock_rank = RankData(
    queueType="RANKED_SOLO_5x5",
    tier="GOLD",
    rank="II",
    leaguePoints=50,
    wins=10,
    losses=5,
)

mock_summoner = SummonerData(
    name="TestUser",
    tagLine="JP1",
    level=100,
    profileIconId=1,
    rank=_mock_rank,
)

mock_matches = [
    MatchData(
        matchId="JP1_001",
        isWin=True,
        gameMode="CLASSIC",
        championName="Ahri",
        kills=5,
        deaths=2,
        assists=8,
        cs=180,
        gameDurationSeconds=1800,
        itemIds=[3157, 3089, 3135, 3020, 3165, 3040, 0],
        timeAgoSeconds=3600,
    )
]

mock_champion_stats = [
    ChampionStatData(
        championName="Ahri",
        wins=5,
        losses=3,
        cs=175.0,
        kda=3.5,
    )
]


# --- 正常系テスト ---


def test_get_summoner_returns_200() -> None:
    """GET /api/summoner/JP/TestUser/JP1 が 200 と SummonerData 形式を返す。"""
    with patch(
        "api.summoner.router.get_summoner_data",
        AsyncMock(return_value=mock_summoner),
    ):
        response = client.get("/api/summoner/JP/TestUser/JP1")

    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "TestUser"
    assert body["tagLine"] == "JP1"
    assert body["level"] == 100
    assert body["profileIconId"] == 1
    assert "rank" in body
    assert body["rank"]["tier"] == "GOLD"
    assert body["rank"]["rank"] == "II"


def test_get_matches_returns_200() -> None:
    """GET /api/summoner/JP/TestUser/JP1/matches が 200 とリストを返す。"""
    with patch(
        "api.summoner.router.get_matches",
        AsyncMock(return_value=mock_matches),
    ):
        response = client.get("/api/summoner/JP/TestUser/JP1/matches")

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert len(body) == 1
    assert body[0]["matchId"] == "JP1_001"
    assert body[0]["championName"] == "Ahri"
    assert body[0]["isWin"] is True


def test_get_champion_stats_returns_200() -> None:
    """GET /api/summoner/JP/TestUser/JP1/champion-stats が 200 とリストを返す。"""
    with patch(
        "api.summoner.router.get_champion_stats",
        AsyncMock(return_value=mock_champion_stats),
    ):
        response = client.get("/api/summoner/JP/TestUser/JP1/champion-stats")

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert len(body) == 1
    assert body[0]["championName"] == "Ahri"
    assert body[0]["wins"] == 5
    assert body[0]["losses"] == 3


# --- 異常系テスト ---


def test_get_summoner_invalid_region_returns_422() -> None:
    """GET /api/summoner/INVALID/TestUser/JP1 が 422 を返す。"""
    response = client.get("/api/summoner/INVALID/TestUser/JP1")
    assert response.status_code == 422


def test_get_summoner_long_game_name_returns_422() -> None:
    """17文字の gameName に対して 422 を返す（max_length=16）。"""
    long_name = "A" * 17  # 17文字 → バリデーション違反
    response = client.get(f"/api/summoner/JP/{long_name}/JP1")
    assert response.status_code == 422


def test_get_summoner_not_found_returns_404() -> None:
    """サービスが HTTPException(404) を発生させた場合、404 と detail を返す。"""
    with patch(
        "api.summoner.router.get_summoner_data",
        AsyncMock(
            side_effect=HTTPException(
                status_code=404, detail="サモナーが見つかりません"
            )
        ),
    ):
        response = client.get("/api/summoner/JP/TestUser/JP1")

    assert response.status_code == 404
    body = response.json()
    assert "detail" in body
    assert body["detail"] == "サモナーが見つかりません"
