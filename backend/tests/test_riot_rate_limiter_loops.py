"""riot_rate_limiter のイベントループをまたぐ動作のテスト。

lollab-backfill・lollab-crawler は呼び出しごとに asyncio.run で新しいループを使う。
温存されたコンテナの2回目以降でも、待ちが発生する acquire が RuntimeError にならず、
送信時刻のカウントが引き継がれることを確認する。
"""

import asyncio

import pytest

from adapters.riot_rate_limiter import RateLimitExceeded, RiotRateLimiter
from tests.test_riot_rate_limiter import FakeTime


class YieldingTime(FakeTime):
    """待機のたびに他のタスクへ制御を渡す時計。ロックの競合（待ち行列）を起こす。"""

    async def sleep(self, seconds: float) -> None:
        await asyncio.sleep(0)
        await super().sleep(seconds)


def _limiter(fake: FakeTime, per_second: int, per_2min: int) -> RiotRateLimiter:
    return RiotRateLimiter(
        [(per_second, 1.0), (per_2min, 120.0)],
        max_wait=10,
        backfill_reserve_ratio=0,
        clock=fake.clock,
        sleep=fake.sleep,
    )


def _acquire_concurrently(limiter: RiotRateLimiter, count: int) -> None:
    """新しいイベントループで、count 個の acquire を並行して行う。"""

    async def _run() -> None:
        await asyncio.gather(*(limiter.acquire("asia") for _ in range(count)))

    asyncio.run(_run())


def test_waiting_acquire_works_in_separate_event_loops() -> None:
    fake = YieldingTime()
    limiter = _limiter(fake, per_second=1, per_2min=100)

    _acquire_concurrently(limiter, 3)
    _acquire_concurrently(limiter, 3)

    assert limiter.total_sent == 6


def test_send_times_carry_over_between_event_loops() -> None:
    fake = YieldingTime()
    limiter = _limiter(fake, per_second=2, per_2min=100)

    _acquire_concurrently(limiter, 2)
    assert fake.sleeps == []

    # 直前のループでの送信が1秒の窓に残っているため、次のループの最初の送信は待つ
    _acquire_concurrently(limiter, 1)
    assert fake.sleeps == [pytest.approx(1.0)]


def test_long_window_count_carries_over_between_event_loops() -> None:
    fake = YieldingTime()
    limiter = _limiter(fake, per_second=100, per_2min=3)

    _acquire_concurrently(limiter, 3)

    with pytest.raises(RateLimitExceeded):
        _acquire_concurrently(limiter, 1)
    assert limiter.total_sent == 3
