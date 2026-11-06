"""ルーターインテグレーションテスト: TestClient を使ったエンドポイント E2E フロー確認。

Requirements: 1.1, 3.1, 9.1〜9.3, 10.1〜10.3
"""

import sys
from datetime import datetime, timezone
from types import ModuleType
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from tests.sync_helpers import install_store_stub

# config と adapters を router の import 前にモックする
_mock_settings = MagicMock()
_mock_settings.riot_api_key = "test-key"
_mock_settings.cors_origins_list = ["http://localhost:3000"]
_mock_config = ModuleType("config")
_mock_config.settings = _mock_settings  # type: ignore[attr-defined]
sys.modules.setdefault("config", _mock_config)
sys.modules.setdefault("adapters", MagicMock())
sys.modules.setdefault("adapters.riot_api", MagicMock())
install_store_stub()

from api.deps.auth import require_allowed_user  # noqa: E402
from api.summoner.router import router  # noqa: E402
from schemas.summoner import (  # noqa: E402
    ChampionStatData,
    MatchData,
    RankData,
    RankPositionData,
    SummonerData,
    SummonerDetail,
)

app = FastAPI()
app.include_router(router)
# 認証は test_auth_dependency.py で検証する。ここでは判定を通す
app.dependency_overrides[require_allowed_user] = lambda: None
client = TestClient(app)

_SEARCH = "api.summoner.router.search_summoner"
_UPDATE = "api.summoner.router.update_summoner"
_BACKFILL = "services.summoner.backfill_dispatch.run_backfill"
_URL = "/api/summoner/JP/TestUser/JP1"

# --- テスト用モックデータ ---

mock_detail = SummonerDetail(
    summoner=SummonerData(
        name="TestUser",
        tagLine="JP1",
        level=100,
        profileIconId=1,
        rank=RankData(
            queueType="RANKED_SOLO_5x5",
            tier="GOLD",
            rank="II",
            leaguePoints=50,
            wins=10,
            losses=5,
        ),
        lastUpdatedAt=datetime(2024, 1, 1, tzinfo=timezone.utc),
    ),
    rankPosition=RankPositionData(position=12, totalPlayers=300, topPercent=45.5),
    matches=[
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
    ],
    championStats=[
        ChampionStatData(championName="Ahri", wins=5, losses=3, cs=175.0, kda=3.5)
    ],
)


# --- GET /api/summoner/{region}/{gameName}/{tagLine} ---


def test_get_summoner_returns_detail() -> None:
    """GET が 200 と SummonerDetail 形式を返す。"""
    with (
        patch(_SEARCH, AsyncMock(return_value=(mock_detail, None))),
        patch(_BACKFILL, AsyncMock()),
    ):
        response = client.get(_URL)

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"summoner", "rankPosition", "matches", "championStats"}
    assert body["summoner"]["name"] == "TestUser"
    assert body["summoner"]["rank"]["tier"] == "GOLD"
    assert body["summoner"]["lastUpdatedAt"].startswith("2024-01-01")
    assert body["rankPosition"]["position"] == 12
    assert body["matches"][0]["matchId"] == "JP1_001"
    assert body["championStats"][0]["championName"] == "Ahri"


def test_get_registers_backfill_when_puuid_returned() -> None:
    """search_summoner が PUUID を返したら、応答後に run_backfill を実行する。"""
    mock_backfill = AsyncMock()
    with (
        patch(_SEARCH, AsyncMock(return_value=(mock_detail, "puuid-0"))),
        patch(_BACKFILL, mock_backfill),
    ):
        response = client.get(_URL)

    assert response.status_code == 200
    mock_backfill.assert_awaited_once_with("JP", "puuid-0")


def test_get_does_not_register_backfill_when_puuid_is_none() -> None:
    """登録済みで PUUID が None なら run_backfill を登録しない。"""
    mock_backfill = AsyncMock()
    with (
        patch(_SEARCH, AsyncMock(return_value=(mock_detail, None))),
        patch(_BACKFILL, mock_backfill),
    ):
        client.get(_URL)

    mock_backfill.assert_not_awaited()


# --- POST /api/summoner/{region}/{gameName}/{tagLine}/update ---


def test_update_returns_detail_and_registers_backfill() -> None:
    """POST が 200 と SummonerDetail を返し、応答後に run_backfill を実行する。"""
    mock_backfill = AsyncMock()
    with (
        patch(_UPDATE, AsyncMock(return_value=(mock_detail, "puuid-0"))),
        patch(_BACKFILL, mock_backfill),
    ):
        response = client.post(f"{_URL}/update")

    assert response.status_code == 200
    assert response.json()["summoner"]["name"] == "TestUser"
    mock_backfill.assert_awaited_once_with("JP", "puuid-0")


def test_update_does_not_register_backfill_when_puuid_is_none() -> None:
    """更新が PUUID を返さなかった（Backfill 不要）なら run_backfill を登録しない。"""
    mock_backfill = AsyncMock()
    with (
        patch(_UPDATE, AsyncMock(return_value=(mock_detail, None))),
        patch(_BACKFILL, mock_backfill),
    ):
        response = client.post(f"{_URL}/update")

    assert response.status_code == 200
    mock_backfill.assert_not_awaited()


def test_update_error_does_not_register_backfill() -> None:
    """更新が失敗したら run_backfill を登録せず、エラーをそのまま返す。"""
    mock_backfill = AsyncMock()
    error = HTTPException(status_code=404, detail="サモナーが見つかりません")
    with patch(_UPDATE, AsyncMock(side_effect=error)), patch(_BACKFILL, mock_backfill):
        response = client.post(f"{_URL}/update")

    assert response.status_code == 404
    assert response.json() == {"detail": "サモナーが見つかりません"}
    mock_backfill.assert_not_awaited()


# --- 入力検証 ---


@pytest.mark.parametrize(
    ("method", "url"),
    [
        ("get", "/api/summoner/INVALID/TestUser/JP1"),
        ("get", f"/api/summoner/JP/{'A' * 17}/JP1"),
        ("get", "/api/summoner/JP/TestUser/ABCDEF"),
        ("post", "/api/summoner/INVALID/TestUser/JP1/update"),
        ("post", f"/api/summoner/JP/{'A' * 17}/JP1/update"),
        ("post", "/api/summoner/JP/TestUser/ABCDEF/update"),
    ],
)
def test_invalid_input_returns_422(method: str, url: str) -> None:
    """不正な region・gameName・tagLine は 422 を返す。"""
    response = getattr(client, method)(url)
    assert response.status_code == 422
    assert "detail" in response.json()


# --- エラー形式 ---


def test_get_summoner_not_found_returns_404() -> None:
    """サービスが HTTPException(404) を発生させた場合、404 と detail を返す。"""
    error = HTTPException(status_code=404, detail="サモナーが見つかりません")
    with patch(_SEARCH, AsyncMock(side_effect=error)):
        response = client.get(_URL)

    assert response.status_code == 404
    assert response.json() == {"detail": "サモナーが見つかりません"}


@pytest.mark.parametrize(
    ("method", "target", "url"),
    [("get", _SEARCH, _URL), ("post", _UPDATE, f"{_URL}/update")],
)
def test_unexpected_error_returns_500_without_internals(
    method: str, target: str, url: str, caplog: pytest.LogCaptureFixture
) -> None:
    """DB 例外などは 500「サーバーエラーが発生しました」に変換し、ログに記録する。"""
    with patch(target, AsyncMock(side_effect=RuntimeError("db password=secret"))):
        with caplog.at_level("ERROR"):
            response = getattr(client, method)(url)

    assert response.status_code == 500
    assert response.json() == {"detail": "サーバーエラーが発生しました"}
    assert "secret" not in response.text
    assert any(r.levelname == "ERROR" and r.exc_info for r in caplog.records)


# --- 廃止したエンドポイント ---


@pytest.mark.parametrize("suffix", ["matches", "champion-stats", "rank-position"])
def test_removed_endpoints_return_404(suffix: str) -> None:
    """/matches、/champion-stats、/rank-position は廃止済み。"""
    assert client.get(f"{_URL}/{suffix}").status_code == 404
