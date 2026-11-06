"""adapters/supabase_jwks.py のテスト: キャッシュ・未知の kid の取り直し・取り直しの間隔。

adapters の submodule を import するため、test_router_properties.py
（sys.modules["adapters"] を差し替える）より前に収集されるファイル名にしている。
"""

from collections.abc import Iterator
from typing import Any

import pytest

import adapters.supabase_jwks as jwks
from tests.jwt_helpers import KeyPair

URL = "https://ref.supabase.co/auth/v1/.well-known/jwks.json"


class Server:
    """JWKS の配信元の代役。取得回数を数え、時刻を進められる。"""

    def __init__(self, *keys: KeyPair) -> None:
        self.keys = list(keys)
        self.fetches = 0
        self.now = 1000.0

    def fetch(self, url: str) -> dict[str, Any]:
        self.fetches += 1
        return {"keys": [k.jwk for k in self.keys]}


@pytest.fixture
def server(monkeypatch: pytest.MonkeyPatch) -> Iterator[Server]:
    fake = Server(KeyPair("ES256", kid="a"))
    monkeypatch.setattr(jwks, "_fetch", fake.fetch)
    monkeypatch.setattr(jwks, "_clock", lambda: fake.now)
    jwks.clear_cache()
    yield fake
    jwks.clear_cache()


def test_key_is_found_and_cached(server: Server) -> None:
    assert jwks.get_signing_key(URL, "a") is not None
    assert jwks.get_signing_key(URL, "a") is not None
    assert server.fetches == 1


def test_cache_expires_after_ttl(server: Server) -> None:
    jwks.get_signing_key(URL, "a")
    server.now += jwks.CACHE_SECONDS + 1
    jwks.get_signing_key(URL, "a")
    assert server.fetches == 2


def test_missing_kid_is_none_without_kid(server: Server) -> None:
    assert jwks.get_signing_key(URL, None) is None
    assert server.fetches == 0


def test_unknown_kid_refetches_and_finds_rotated_key(server: Server) -> None:
    jwks.get_signing_key(URL, "a")
    server.keys.append(KeyPair("ES256", kid="b"))
    server.now += jwks.REFETCH_COOLDOWN_SECONDS + 1

    assert jwks.get_signing_key(URL, "b") is not None
    assert server.fetches == 2


def test_unknown_kid_does_not_refetch_within_cooldown(server: Server) -> None:
    jwks.get_signing_key(URL, "a")
    for _ in range(5):
        assert jwks.get_signing_key(URL, "zzz") is None
    assert server.fetches == 1


def test_unknown_kid_refetches_once_per_cooldown(server: Server) -> None:
    jwks.get_signing_key(URL, "a")
    server.now += jwks.REFETCH_COOLDOWN_SECONDS + 1
    assert jwks.get_signing_key(URL, "zzz") is None
    assert jwks.get_signing_key(URL, "zzz") is None
    assert server.fetches == 2


def test_url_change_refetches(server: Server) -> None:
    jwks.get_signing_key(URL, "a")
    jwks.get_signing_key(URL + "?x=1", "a")
    assert server.fetches == 2
