"""services/match/detail.py と api/match/router.py のテスト。

_Requirements: 4.4, 4.5, 5.1, 5.2
"""

import asyncio
from typing import Any
from unittest.mock import AsyncMock

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from api.deps.auth import require_allowed_user
from schemas.match_detail import RankBrief
from tests.match_helpers import (
    event,
    install_match_stubs,
    raw_detail,
    timeline_of,
)

install_match_stubs()

from api.match.router import router  # noqa: E402
from services.match import detail as detail_service  # noqa: E402


@pytest.fixture
def deps(monkeypatch: pytest.MonkeyPatch) -> dict[str, AsyncMock]:
    """存在する試合（まとめファイルのキーあり）と、生データの読み出しの代役。"""
    mocks = {
        "key": AsyncMock(return_value=(True, "bundles/a.jsonl.gz")),
        "raw": AsyncMock(return_value=(raw_detail(), _timeline())),
        "ranks": AsyncMock(
            return_value={"puuid-0": RankBrief(tier="EMERALD", division="II")}
        ),
    }
    monkeypatch.setattr(detail_service.match_store, "get_raw_bundle_key", mocks["key"])
    monkeypatch.setattr(detail_service.raw_source, "load_raw", mocks["raw"])
    monkeypatch.setattr(detail_service.match_rank_store, "get_ranks", mocks["ranks"])
    return mocks


def _timeline() -> dict[str, Any]:
    return timeline_of(
        [
            event("ITEM_PURCHASED", 1, 5_000, itemId=1055),
            event("SKILL_LEVEL_UP", 1, 10_000, skillSlot=1, levelUpType="NORMAL"),
        ]
    )


# --- get_match_detail ---


def test_detail_combines_raw_data_ranks_and_builds(deps: dict[str, AsyncMock]) -> None:
    response = asyncio.run(detail_service.get_match_detail("JP1_1"))

    deps["raw"].assert_awaited_once_with("JP1_1", "bundles/a.jsonl.gz")
    assert deps["ranks"].await_args is not None
    assert set(deps["ranks"].await_args.args[0]) == {f"puuid-{i}" for i in range(10)}
    first = next(p for p in response.participants if p.puuid == "puuid-0")
    assert first.rank == RankBrief(tier="EMERALD", division="II")
    assert first.build is not None
    assert first.build.skill_order == [1]
    assert first.build.item_purchases[0].item_ids == [1055]
    other = next(p for p in response.participants if p.puuid == "puuid-1")
    assert other.rank is None and other.build is not None


def test_unknown_match_is_404_without_reading_raw_data(
    deps: dict[str, AsyncMock],
) -> None:
    deps["key"].return_value = (False, None)

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(detail_service.get_match_detail("JP1_404"))

    assert exc_info.value.status_code == 404
    deps["raw"].assert_not_awaited()  # Riot API も呼ばない
    deps["ranks"].assert_not_awaited()


def test_missing_timeline_gives_participants_without_build(
    deps: dict[str, AsyncMock],
) -> None:
    deps["raw"].return_value = (raw_detail(), None)

    response = asyncio.run(detail_service.get_match_detail("JP1_1"))

    assert all(p.build is None for p in response.participants)
    assert len(response.participants) == 10


def test_unreadable_timeline_keeps_overview(deps: dict[str, AsyncMock]) -> None:
    deps["raw"].return_value = (raw_detail(), {"info": {}})

    response = asyncio.run(detail_service.get_match_detail("JP1_1"))

    assert all(p.build is None for p in response.participants)


def test_unreadable_detail_is_502(deps: dict[str, AsyncMock]) -> None:
    deps["raw"].return_value = ({"info": {}}, None)

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(detail_service.get_match_detail("JP1_1"))

    assert exc_info.value.status_code == 502


def test_raw_source_errors_propagate(deps: dict[str, AsyncMock]) -> None:
    deps["raw"].side_effect = HTTPException(status_code=429, detail="x")

    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(detail_service.get_match_detail("JP1_1"))

    assert exc_info.value.status_code == 429


# --- ルーター ---

app = FastAPI()
app.include_router(router)
# 認証は test_auth_dependency.py で検証する。ここでは判定を通す
app.dependency_overrides[require_allowed_user] = lambda: None
client = TestClient(app, raise_server_exceptions=False)


def test_router_returns_detail_with_one_day_private_cache(
    deps: dict[str, AsyncMock],
) -> None:
    response = client.get("/api/match/JP1_1")

    assert response.status_code == 200
    assert response.headers["Cache-Control"] == "private, max-age=86400"
    body = response.json()
    assert body["match_id"] == "JP1_1"
    assert len(body["participants"]) == 10 and len(body["teams"]) == 2
    ranked = next(p for p in body["participants"] if p["puuid"] == "puuid-0")
    assert ranked["rank"] == {"tier": "EMERALD", "division": "II"}


def test_router_does_not_cache_response_without_timeline(
    deps: dict[str, AsyncMock],
) -> None:
    deps["raw"].return_value = (raw_detail(), None)

    response = client.get("/api/match/JP1_1")

    assert response.status_code == 200
    assert response.headers["Cache-Control"] == "private, no-cache"
    assert response.json()["participants"][0]["build"] is None


@pytest.mark.parametrize(
    "match_id", ["jp1_1", "JP1-1", "JP1_", "_1", "J_1", "TOOLONG_1", "JP1_" + "1" * 21]
)
def test_router_rejects_invalid_match_id_with_422(
    deps: dict[str, AsyncMock], match_id: str
) -> None:
    assert client.get(f"/api/match/{match_id}").status_code == 422
    deps["key"].assert_not_awaited()


@pytest.mark.parametrize("status", [404, 429, 502])
def test_router_passes_through_http_errors(
    deps: dict[str, AsyncMock], monkeypatch: pytest.MonkeyPatch, status: int
) -> None:
    monkeypatch.setattr(
        "api.match.router.get_match_detail",
        AsyncMock(side_effect=HTTPException(status_code=status, detail="msg")),
    )

    response = client.get("/api/match/JP1_1")

    assert response.status_code == status
    assert response.json() == {"detail": "msg"}
    assert "Cache-Control" not in response.headers


def test_router_hides_unexpected_errors_as_500(
    deps: dict[str, AsyncMock],
) -> None:
    deps["key"].side_effect = RuntimeError("db password=secret")

    response = client.get("/api/match/JP1_1")

    assert response.status_code == 500
    assert "secret" not in response.text


def test_router_has_auth_dependency() -> None:
    assert any(d.dependency is require_allowed_user for d in router.dependencies)
