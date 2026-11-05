"""riot_api.get() の 429 再送のテスト: MockTransport で応答を返し、待機は記録だけにする。

_Requirements: 9.3_
"""

import asyncio
import importlib.util
from collections.abc import Iterator
from pathlib import Path
from types import ModuleType, SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock

import httpx
import pytest

from adapters.riot_rate_limiter import (
    Priority,
    RateLimitExceeded,
    RiotRateLimiter,
    set_limiter,
)
from tests.test_riot_rate_limiter import FakeTime, _limiter, _load_riot_api


class Server:
    """リクエストごとに用意した応答を順に返し、受けた回数を数える。"""

    def __init__(self, *responses: httpx.Response) -> None:
        self._responses = list(responses)
        self.requests = 0

    def handler(self, request: httpx.Request) -> httpx.Response:
        self.requests += 1
        return self._responses.pop(0)


def _too_many(retry_after: str | None) -> httpx.Response:
    headers = {} if retry_after is None else {"Retry-After": retry_after}
    return httpx.Response(429, headers=headers)


@pytest.fixture
def sleeps() -> list[float]:
    """再送前の待機（秒）の記録。"""
    return []


@pytest.fixture
def riot_api(
    monkeypatch: pytest.MonkeyPatch, sleeps: list[float]
) -> Iterator[ModuleType]:
    module = _load_riot_api()

    async def fake_sleep(seconds: float) -> None:
        sleeps.append(seconds)

    monkeypatch.setattr(module, "_sleep", fake_sleep)
    # 他のテストが config を MagicMock に差し替えていても、ヘッダー値を文字列にする
    monkeypatch.setattr(module, "settings", SimpleNamespace(riot_api_key="test-key"))
    yield module
    set_limiter(None)


def _use(
    riot_api: ModuleType,
    monkeypatch: pytest.MonkeyPatch,
    server: Server,
    limiter: RiotRateLimiter | None = None,
) -> AsyncMock:
    """サーバーとレート制限器を差し替え、acquire の呼び出しを記録する AsyncMock を返す。"""
    limiter = limiter or _limiter(FakeTime())
    acquire = AsyncMock(wraps=limiter.acquire)
    monkeypatch.setattr(limiter, "acquire", acquire)
    set_limiter(limiter)
    client = httpx.AsyncClient(transport=httpx.MockTransport(server.handler))
    monkeypatch.setattr(riot_api, "_get_client", lambda: client)
    return acquire


def _get(riot_api: ModuleType, priority: Priority = "interactive") -> Any:
    return asyncio.run(riot_api.get("asia", "/x", priority=priority))


def test_retries_once_and_succeeds_when_retry_after_is_1(
    riot_api: ModuleType, monkeypatch: pytest.MonkeyPatch, sleeps: list[float]
) -> None:
    """interactive で Retry-After 1 の 429 なら、1秒待って再送し、成功した結果を返す。"""
    server = Server(_too_many("1"), httpx.Response(200, json={"ok": True}))
    _use(riot_api, monkeypatch, server)

    assert _get(riot_api) == {"ok": True}
    assert server.requests == 2
    assert sleeps == [1.0]


def test_retry_goes_through_rate_limiter_twice(
    riot_api: ModuleType, monkeypatch: pytest.MonkeyPatch
) -> None:
    """再送もレート制限器を通す（カウント対象）。"""
    server = Server(_too_many("1"), httpx.Response(200, json={}))
    acquire = _use(riot_api, monkeypatch, server)

    _get(riot_api)

    assert [c.args for c in acquire.await_args_list] == [
        ("asia", "interactive"),
        ("asia", "interactive"),
    ]


def test_retry_raises_rate_limit_exceeded_at_2min_limit(
    riot_api: ModuleType, monkeypatch: pytest.MonkeyPatch
) -> None:
    """再送時に2分の上限に達していたら、再送せず RateLimitExceeded になる。"""
    server = Server(_too_many("1"))
    _use(riot_api, monkeypatch, server, _limiter(FakeTime(), per_2min=1))

    with pytest.raises(RateLimitExceeded):
        _get(riot_api)

    assert server.requests == 1


@pytest.mark.parametrize(
    ("retry_after", "priority"),
    [
        (None, "interactive"),
        ("3", "interactive"),
        ("2.5", "interactive"),
        ("0", "interactive"),
        ("abc", "interactive"),
        ("nan", "interactive"),
        ("Wed, 21 Oct 2026 07:28:00 GMT", "interactive"),
        ("1", "backfill"),
    ],
)
def test_does_not_retry(
    riot_api: ModuleType,
    monkeypatch: pytest.MonkeyPatch,
    sleeps: list[float],
    retry_after: str | None,
    priority: Priority,
) -> None:
    """ヘッダーなし・2秒超・0・数値でない・backfill では再送せず HTTPStatusError。"""
    server = Server(_too_many(retry_after))
    acquire = _use(riot_api, monkeypatch, server)

    with pytest.raises(httpx.HTTPStatusError) as exc_info:
        _get(riot_api, priority)

    assert exc_info.value.response.status_code == 429
    assert server.requests == 1
    assert acquire.await_count == 1
    assert sleeps == []


def test_retries_when_retry_after_is_exactly_2(
    riot_api: ModuleType, monkeypatch: pytest.MonkeyPatch, sleeps: list[float]
) -> None:
    """2秒ちょうどは再送の対象。"""
    server = Server(_too_many("2"), httpx.Response(200, json={}))
    _use(riot_api, monkeypatch, server)

    _get(riot_api)

    assert server.requests == 2
    assert sleeps == [2.0]


def test_raises_when_still_429_after_retry(
    riot_api: ModuleType, monkeypatch: pytest.MonkeyPatch, sleeps: list[float]
) -> None:
    """再送は1回だけ。再送後も 429 なら HTTPStatusError。"""
    server = Server(_too_many("1"), _too_many("1"))
    _use(riot_api, monkeypatch, server)

    with pytest.raises(httpx.HTTPStatusError) as exc_info:
        _get(riot_api)

    assert exc_info.value.response.status_code == 429
    assert server.requests == 2
    assert sleeps == [1.0]


def test_non_429_errors_are_not_retried(
    riot_api: ModuleType, monkeypatch: pytest.MonkeyPatch
) -> None:
    """429 以外のエラーは、Retry-After があっても再送しない。"""
    server = Server(httpx.Response(503, headers={"Retry-After": "1"}))
    _use(riot_api, monkeypatch, server)

    with pytest.raises(httpx.HTTPStatusError):
        _get(riot_api)

    assert server.requests == 1


def test_default_rate_limits_leave_margin_below_personal_key() -> None:
    """既定値は Personal キー（20/秒・100/2分）より余裕を持たせた 18 / 95。"""
    # 他のテストが sys.modules["config"] を差し替えていても影響されないよう、パスから読み込む
    path = Path(__file__).resolve().parent.parent / "config.py"
    spec = importlib.util.spec_from_file_location("config_under_test", path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    fields = module.Settings.model_fields
    assert fields["riot_rate_limit_per_second"].default == 18
    assert fields["riot_rate_limit_per_2min"].default == 95
