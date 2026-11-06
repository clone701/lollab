"""riot_rate_limiter の窓の一般化のテスト: Personal 既定値、3窓、Production 相当、backfill の割合。"""

import asyncio
from collections.abc import Sequence

import pytest

from adapters.riot_rate_limiter import Priority, RateLimitExceeded, RiotRateLimiter
from tests.test_riot_rate_limiter import FakeTime

PERSONAL = [(18, 1.0), (95, 120.0)]
PRODUCTION = [(450, 10.0), (27000, 600.0)]


def _make(
    fake: FakeTime,
    windows: Sequence[tuple[int, float]],
    max_wait: float = 10,
    ratio: float = 0.3,
) -> RiotRateLimiter:
    return RiotRateLimiter(
        windows,
        max_wait=max_wait,
        backfill_reserve_ratio=ratio,
        clock=fake.clock,
        sleep=fake.sleep,
    )


def _send(
    limiter: RiotRateLimiter,
    fake: FakeTime,
    count: int,
    priority: Priority = "interactive",
    spacing: float = 0.0,
) -> None:
    """count 回送る。spacing 秒ずつ時計を進める（短い窓で待たないため）。"""

    async def _run() -> None:
        for _ in range(count):
            await limiter.acquire("asia", priority)
            fake.now += spacing

    asyncio.run(_run())


# --- Personal キーの既定値（従来の 1秒18回・2分95回・予約30回）と同じ動作 ---


def test_personal_waits_at_18_per_second() -> None:
    fake = FakeTime()
    limiter = _make(fake, PERSONAL)

    _send(limiter, fake, 18)
    assert fake.sleeps == []

    _send(limiter, fake, 1)
    assert fake.sleeps == [pytest.approx(1.0)]


def test_personal_interactive_raises_at_95_per_2min() -> None:
    fake = FakeTime()
    limiter = _make(fake, PERSONAL)
    _send(limiter, fake, 95, spacing=1.0)

    with pytest.raises(RateLimitExceeded):
        _send(limiter, fake, 1)

    assert fake.sleeps == []


def test_personal_backfill_stops_below_28_5_remaining() -> None:
    """予約は 95 × 0.3 = 28.5 回。残り29回なら送れ、残り28回なら止まる。"""
    fake = FakeTime()
    limiter = _make(fake, PERSONAL)

    _send(limiter, fake, 67, "backfill", spacing=1.0)  # 残り28になる
    with pytest.raises(RateLimitExceeded):
        _send(limiter, fake, 1, "backfill")

    _send(limiter, fake, 28, "interactive")  # 検索・更新は上限まで送れる
    with pytest.raises(RateLimitExceeded):
        _send(limiter, fake, 1, "interactive")


# --- 3つ以上の窓 ---


def test_three_windows_each_limit_is_enforced() -> None:
    """2/1秒・5/10秒・8/100秒。短い2つは待ち、100秒窓（max_wait 超）は例外。"""
    fake = FakeTime()
    limiter = _make(fake, [(8, 100.0), (2, 1.0), (5, 10.0)])  # 順不同で渡せる

    _send(limiter, fake, 5)
    assert fake.sleeps == [pytest.approx(1.0), pytest.approx(1.0)]  # 1秒窓

    _send(limiter, fake, 1)  # 10秒窓が埋まっている（最も古い送信が出るまで8秒）
    assert fake.sleeps[2:] == [pytest.approx(8.0)]

    _send(limiter, fake, 2)  # 7回目、8回目（8回目は1秒窓と10秒窓が両方1秒待ち）
    assert fake.sleeps[3:] == [pytest.approx(1.0)]

    with pytest.raises(RateLimitExceeded):  # 9回目は100秒窓が埋まっている
        _send(limiter, fake, 1)


def test_sleep_is_the_longest_of_the_blocked_windows() -> None:
    """複数の窓が埋まっているときは、最も長く待つ窓に合わせる。"""
    fake = FakeTime()
    limiter = _make(fake, [(1, 1.0), (2, 5.0)])
    _send(limiter, fake, 1)
    fake.now += 0.5
    _send(limiter, fake, 1)  # 1秒窓で0.5秒待つ

    _send(limiter, fake, 1)  # 1秒窓は1.0待ち、5秒窓は先頭が出るまで4.0秒待つ

    assert fake.sleeps == [pytest.approx(0.5), pytest.approx(4.0)]


# --- Production 相当（450:10, 27000:600） ---


def test_production_waits_on_10s_window() -> None:
    fake = FakeTime()
    limiter = _make(fake, PRODUCTION)
    _send(limiter, fake, 450)
    assert fake.sleeps == []

    _send(limiter, fake, 1)

    assert fake.sleeps == [pytest.approx(10.0)]


def test_production_raises_on_600s_window_without_waiting() -> None:
    fake = FakeTime()
    limiter = _make(fake, PRODUCTION)
    _send(limiter, fake, 27000)  # 10秒窓の待ちを挟みながら 590 秒で使い切る
    sleeps_before = len(fake.sleeps)
    assert fake.now - 1000.0 == pytest.approx(590.0)

    with pytest.raises(RateLimitExceeded):
        _send(limiter, fake, 1)

    assert len(fake.sleeps) == sleeps_before


# --- backfill の予約割合 ---


@pytest.mark.parametrize(
    ("ratio", "expected_sends"),
    [(0.0, 100), (0.5, 51), (1.0, 1)],
)
def test_backfill_stops_by_ratio(ratio: float, expected_sends: int) -> None:
    """最も長い窓の残り回数が「上限 × ratio」未満になったら backfill は止まる。"""
    fake = FakeTime()
    limiter = _make(fake, [(10, 1.0), (100, 120.0)], ratio=ratio)

    _send(limiter, fake, expected_sends, "backfill", spacing=1.0)
    with pytest.raises(RateLimitExceeded):
        _send(limiter, fake, 1, "backfill")


# --- 不正な窓 ---


@pytest.mark.parametrize(
    "windows",
    [[], [(0, 1.0)], [(10, 0.0)], [(-1, 1.0)], [(10, 1.0), (20, 1.0)]],
)
def test_invalid_windows_raise_value_error(windows: list[tuple[int, float]]) -> None:
    with pytest.raises(ValueError):
        _make(FakeTime(), windows)
