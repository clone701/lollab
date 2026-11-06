"""チャンピオンビルド API ルーターのテスト: 入力検証 422、エラー形式、DB 例外で 500。

_Requirements: 5.1, 5.2_ / design.md「エラー処理」
"""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from tests.champion_helpers import install_champion_store_stub

install_champion_store_stub()

from api.champion.router import router  # noqa: E402
from api.deps.auth import require_allowed_user  # noqa: E402
from schemas.champion import ChampionBuildResponse, ChampionBuildSummary  # noqa: E402
from services.champion.build_elements import build_elements  # noqa: E402

app = FastAPI()
app.include_router(router)
# 認証は test_auth_dependency.py で検証する。ここでは判定を通す
app.dependency_overrides[require_allowed_user] = lambda: None
client = TestClient(app, raise_server_exceptions=False)

_SERVICE = "api.champion.router.get_champion_build"
_URL = "/api/champion/LeeSin/build"


def _response() -> ChampionBuildResponse:
    return ChampionBuildResponse(
        champion_name="LeeSin",
        role=None,
        roles={},
        period="latest_patch",
        queue="all",
        rank="all",
        latest_patch=None,
        summary=ChampionBuildSummary(
            games=0, wins=0, win_rate_delta=0.0, pick_rate=0.0, ban_rate=0.0
        ),
        **build_elements([]),
    )


def test_defaults_are_passed_to_service() -> None:
    with patch(_SERVICE, AsyncMock(return_value=_response())) as service:
        response = client.get(_URL)

    assert response.status_code == 200
    service.assert_awaited_once_with("LeeSin", None, "latest_patch", "all", "all")
    body = response.json()
    assert body["champion_name"] == "LeeSin"
    assert body["rank"] == "all"
    assert body["role"] is None
    assert body["runes"] == {"games": 0, "options": [], "best_win_rate": None}


def test_query_parameters_are_passed_to_service() -> None:
    with patch(_SERVICE, AsyncMock(return_value=_response())) as service:
        response = client.get(
            f"{_URL}?role=UTILITY&period=last_30_days&queue=flex&rank=diamond_plus"
        )

    assert response.status_code == 200
    service.assert_awaited_once_with(
        "LeeSin", "UTILITY", "last_30_days", "flex", "diamond_plus"
    )


@pytest.mark.parametrize(
    "path",
    [
        "/api/champion/Lee-Sin/build",
        "/api/champion/Lee%20Sin/build",
        "/api/champion/%E3%83%AA%E3%83%BB%E3%82%B7%E3%83%B3/build",
        f"/api/champion/{'a' * 31}/build",
        f"{_URL}?role=SUPPORT",
        f"{_URL}?role=top",
        f"{_URL}?role=",
        f"{_URL}?period=week",
        f"{_URL}?queue=aram",
        f"{_URL}?rank=gold_plus",
        f"{_URL}?rank=",
        f"{_URL}?rank=ALL",
    ],
)
def test_invalid_input_returns_422_with_detail(path: str) -> None:
    with patch(_SERVICE, AsyncMock(return_value=_response())) as service:
        response = client.get(path)

    assert response.status_code == 422
    assert "detail" in response.json()
    service.assert_not_awaited()


def test_name_of_thirty_characters_is_accepted() -> None:
    with patch(_SERVICE, AsyncMock(return_value=_response())):
        response = client.get(f"/api/champion/{'a' * 30}/build")

    assert response.status_code == 200


def test_unexpected_error_returns_500_without_internal_details() -> None:
    error = RuntimeError("connection to db.example.supabase.co failed")
    with patch(_SERVICE, AsyncMock(side_effect=error)):
        response = client.get(_URL)

    assert response.status_code == 500
    assert response.json() == {"detail": "サーバーエラーが発生しました"}
    assert "supabase" not in response.text
