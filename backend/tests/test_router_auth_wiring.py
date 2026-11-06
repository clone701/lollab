"""全ルーターに require_allowed_user が付いていること、favorites の認証ヘッダーの扱い。

_Requirements: 5.5, 5.9_
"""

import sys
from collections.abc import Iterator
from types import ModuleType, SimpleNamespace
from typing import Any
from unittest.mock import patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from api.deps import auth
from tests.champion_helpers import install_champion_store_stub
from tests.match_helpers import install_match_stubs
from tests.store_helpers import FakeClient
from tests.sync_helpers import install_store_stub

install_store_stub()
install_champion_store_stub()
install_match_stubs()

# favorites は import 時に Supabase クライアントを作るため、代役を差し込んで読み込む
_fake_supabase = ModuleType("adapters.supabase")
_fake_supabase.supabase = FakeClient()  # type: ignore[attr-defined]
with patch.dict(sys.modules, {"adapters.supabase": _fake_supabase}):
    from api.favorites import router as favorites  # noqa: E402

from api.champion.router import router as champion_router  # noqa: E402
from api.match.router import router as match_router  # noqa: E402
from api.summoner.router import router as summoner_router  # noqa: E402

_ROUTERS = {
    "summoner": (summoner_router, "/api/summoner/JP/Test/JP1"),
    "champion": (champion_router, "/api/champion/Ahri/build"),
    "match": (match_router, "/api/match/JP1_1"),
    "favorites": (favorites.router, "/api/favorites"),
}


def _app() -> TestClient:
    app = FastAPI()
    for router, _ in _ROUTERS.values():
        app.include_router(router)
    return TestClient(app, raise_server_exceptions=False)


@pytest.mark.parametrize("name", list(_ROUTERS))
def test_router_has_auth_dependency(name: str) -> None:
    router, _ = _ROUTERS[name]
    assert any(d.dependency is auth.require_allowed_user for d in router.dependencies)


@pytest.mark.parametrize("name", list(_ROUTERS))
def test_enabled_gate_rejects_request_without_header(
    name: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(
        auth,
        "settings",
        SimpleNamespace(user_gate_enabled=True, allowed_emails_list=[]),
    )
    _, url = _ROUTERS[name]

    assert _app().get(url).status_code == 401


# --- favorites の認証ヘッダー ---


class FakeAuthClient(FakeClient):
    """auth.get_user(token) で受け取ったトークンを記録する Supabase クライアントの代役。"""

    def __init__(self) -> None:
        super().__init__([])
        self.tokens: list[str] = []
        self.auth = SimpleNamespace(get_user=self._get_user)

    def _get_user(self, token: str) -> Any:
        self.tokens.append(token)
        return SimpleNamespace(user=SimpleNamespace(id="user-1"))


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> Iterator[FakeAuthClient]:
    fake = FakeAuthClient()
    monkeypatch.setattr(favorites, "supabase", fake)
    monkeypatch.setattr(auth, "settings", SimpleNamespace(user_gate_enabled=False))
    yield fake


def _list(headers: dict[str, str]) -> int:
    return int(_app().get("/api/favorites", headers=headers).status_code)


def test_x_lollab_auth_is_used_for_favorites(client: FakeAuthClient) -> None:
    assert _list({"X-Lollab-Auth": "Bearer tok-lollab"}) == 200
    assert client.tokens == ["tok-lollab"]


def test_x_lollab_auth_takes_priority_over_authorization(
    client: FakeAuthClient,
) -> None:
    headers = {"X-Lollab-Auth": "Bearer tok-lollab", "Authorization": "Bearer tok-old"}

    assert _list(headers) == 200
    assert client.tokens == ["tok-lollab"]


def test_authorization_header_still_works_without_x_lollab_auth(
    client: FakeAuthClient,
) -> None:
    assert _list({"Authorization": "Bearer tok-old"}) == 200
    assert client.tokens == ["tok-old"]


def test_favorites_requires_login_even_when_gate_is_disabled(
    client: FakeAuthClient,
) -> None:
    assert _list({}) == 401
    assert _list({"X-Lollab-Auth": "Basic abc"}) == 401
    assert client.tokens == []
