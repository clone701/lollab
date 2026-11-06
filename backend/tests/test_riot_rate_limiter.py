"""riot_rate_limiter のテスト: 時刻取得と待機を差し替え、実時間に依存せず確認する。

_Requirements: 9.1〜9.4_
"""

import asyncio
import importlib.util
from pathlib import Path
from types import ModuleType
from unittest.mock import AsyncMock, MagicMock

import pytest

from adapters.riot_rate_limiter import (
    Priority,
    RateLimitExceeded,
    RiotRateLimiter,
    set_limiter,
)


class FakeTime:
    """進められる時計。sleep は待機せず、時計を進めるだけ。"""

    def __init__(self) -> None:
        self.now = 1000.0
        self.sleeps: list[float] = []

    def clock(self) -> float:
        return self.now

    async def sleep(self, seconds: float) -> None:
        self.sleeps.append(seconds)
        self.now += seconds


def _limiter(
    fake: FakeTime, per_second: int = 20, per_2min: int = 100, ratio: float = 0.3
) -> RiotRateLimiter:
    """1秒・2分の2窓（max_wait 10秒）のレート制限。"""
    return RiotRateLimiter(
        [(per_second, 1.0), (per_2min, 120.0)],
        max_wait=10,
        backfill_reserve_ratio=ratio,
        clock=fake.clock,
        sleep=fake.sleep,
    )


def _acquire_n(
    limiter: RiotRateLimiter, host: str, count: int, priority: Priority
) -> None:
    async def _run() -> None:
        for _ in range(count):
            await limiter.acquire(host, priority)

    asyncio.run(_run())


def test_waits_when_per_second_limit_is_reached() -> None:
    """1秒の上限に達したら、空くまで待ってから送る。"""
    fake = FakeTime()
    limiter = _limiter(fake, per_second=3)

    _acquire_n(limiter, "asia", 3, "interactive")
    assert fake.sleeps == []

    _acquire_n(limiter, "asia", 1, "interactive")
    assert fake.sleeps == [pytest.approx(1.0)]


def test_wait_uses_sliding_window() -> None:
    """直近1秒に入っている最も古い送信が出るまでの時間だけ待つ。"""
    fake = FakeTime()
    limiter = _limiter(fake, per_second=2)
    _acquire_n(limiter, "asia", 1, "interactive")
    fake.now += 0.4
    _acquire_n(limiter, "asia", 1, "interactive")

    _acquire_n(limiter, "asia", 1, "interactive")

    assert fake.sleeps == [pytest.approx(0.6)]


def test_concurrent_calls_never_exceed_per_second_limit() -> None:
    """並行して呼んでも、どの1秒間も上限を超えて送らない。"""
    fake = FakeTime()
    limiter = _limiter(fake, per_second=3)
    sent: list[float] = []

    async def _one() -> None:
        await limiter.acquire("asia")
        sent.append(fake.now)

    async def _run() -> None:
        await asyncio.gather(*(_one() for _ in range(10)))

    asyncio.run(_run())

    assert len(sent) == 10
    for t in sent:
        assert len([s for s in sent if t <= s < t + 1.0]) <= 3


def test_interactive_raises_immediately_at_2min_limit() -> None:
    """2分の上限に達したら、待たずに RateLimitExceeded を送出する。"""
    fake = FakeTime()
    limiter = _limiter(fake, per_second=100, per_2min=5)
    _acquire_n(limiter, "asia", 5, "interactive")

    with pytest.raises(RateLimitExceeded) as exc_info:
        _acquire_n(limiter, "asia", 1, "interactive")

    assert exc_info.value.host == "asia"
    assert fake.sleeps == []


def test_2min_window_frees_up_after_120_seconds() -> None:
    """120秒たった送信は数えなくなり、再び送れる。"""
    fake = FakeTime()
    limiter = _limiter(fake, per_second=100, per_2min=5)
    _acquire_n(limiter, "asia", 5, "interactive")

    fake.now += 120.0

    _acquire_n(limiter, "asia", 5, "interactive")


def test_backfill_stops_when_remaining_is_below_reserve() -> None:
    """Backfill は残りが予約分未満なら送らない。検索・更新は上限まで送れる。"""
    fake = FakeTime()
    limiter = _limiter(fake, per_second=100, per_2min=10, ratio=0.3)
    _acquire_n(limiter, "asia", 7, "backfill")  # 残り3 → まだ送れる
    _acquire_n(limiter, "asia", 1, "backfill")  # 残り2になる

    with pytest.raises(RateLimitExceeded):
        _acquire_n(limiter, "asia", 1, "backfill")

    _acquire_n(limiter, "asia", 2, "interactive")
    with pytest.raises(RateLimitExceeded):
        _acquire_n(limiter, "asia", 1, "interactive")


def test_hosts_are_counted_independently() -> None:
    """ホストごとに独立して数える。"""
    fake = FakeTime()
    limiter = _limiter(fake, per_second=100, per_2min=3)
    _acquire_n(limiter, "asia", 3, "interactive")

    _acquire_n(limiter, "jp1", 3, "interactive")
    with pytest.raises(RateLimitExceeded):
        _acquire_n(limiter, "asia", 1, "interactive")


def _load_riot_api() -> ModuleType:
    """他のテストの sys.modules の差し替えに影響されないよう、パスから読み込む。"""
    path = Path(__file__).resolve().parent.parent / "adapters" / "riot_api.py"
    spec = importlib.util.spec_from_file_location("riot_api_under_test", path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_riot_api_get_acquires_with_priority_before_sending(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """get() は送信前に priority を指定してレート制限を確認する。"""
    riot_api = _load_riot_api()
    limiter = _limiter(FakeTime())
    acquire = AsyncMock(wraps=limiter.acquire)
    monkeypatch.setattr(limiter, "acquire", acquire)
    set_limiter(limiter)
    response = MagicMock()
    response.json.return_value = {"ok": True}
    client = MagicMock()
    client.get = AsyncMock(return_value=response)
    monkeypatch.setattr(riot_api, "_get_client", lambda: client)

    try:
        asyncio.run(riot_api.get("asia", "/x", priority="backfill"))
        asyncio.run(riot_api.get("asia", "/x"))
    finally:
        set_limiter(None)

    assert [c.args for c in acquire.await_args_list] == [
        ("asia", "backfill"),
        ("asia", "interactive"),
    ]


def test_riot_api_get_does_not_send_when_rate_limited(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """上限に達していたら HTTP リクエストを送らずに RateLimitExceeded を送出する。"""
    riot_api = _load_riot_api()
    limiter = _limiter(FakeTime(), per_2min=1)
    asyncio.run(limiter.acquire("asia"))
    set_limiter(limiter)
    client = MagicMock()
    client.get = AsyncMock()
    monkeypatch.setattr(riot_api, "_get_client", lambda: client)

    try:
        with pytest.raises(RateLimitExceeded):
            asyncio.run(riot_api.get("asia", "/x"))
    finally:
        set_limiter(None)

    client.get.assert_not_called()
