"""Riot API のレート制限: ホスト単位のスライディングウィンドウで送信回数を数える。

- 1秒の上限に達したら、空くまで待ってから送る
- 2分の上限に達したら、待たずに RateLimitExceeded を送出する
- priority="backfill" は、2分の残り回数が予約分（backfill_reserve）を下回ったら
  送らずに RateLimitExceeded を送出する（検索・更新用に残り回数を確保するため）

カウントはプロセス内のメモリで持つ。複数インスタンス・複数ワーカーで動かす場合は
共有ストアが必要（現状は1プロセス）。
"""

import asyncio
import time
from collections import deque
from collections.abc import Awaitable, Callable
from typing import Literal

from config import settings

Priority = Literal["interactive", "backfill"]

_SHORT_WINDOW_SECONDS = 1.0
_LONG_WINDOW_SECONDS = 120.0


class RateLimitExceeded(Exception):
    """2分あたりの上限（または Backfill の予約分）に達し、送信できないことを表す。"""

    def __init__(self, host: str) -> None:
        super().__init__(f"Riot API のレート制限に達しました: host={host}")
        self.host = host


class _HostWindow:
    """ホストごとの送信時刻（古い順）と、並行アクセスを守るロック。"""

    def __init__(self) -> None:
        self.sent: deque[float] = deque()
        self.lock = asyncio.Lock()


class RiotRateLimiter:
    """ホスト単位のレート制限。時刻取得と待機は差し替えられる（テスト用）。"""

    def __init__(
        self,
        per_second: int,
        per_2min: int,
        backfill_reserve: int,
        clock: Callable[[], float] = time.monotonic,
        sleep: Callable[[float], Awaitable[None]] = asyncio.sleep,
    ) -> None:
        self._per_second = max(per_second, 1)
        self._per_2min = per_2min
        self._backfill_reserve = backfill_reserve
        self._clock = clock
        self._sleep = sleep
        self._windows: dict[str, _HostWindow] = {}

    async def acquire(self, host: str, priority: Priority = "interactive") -> None:
        """送信の許可を得て、送信時刻を記録する。

        Raises:
            RateLimitExceeded: 2分の上限に達した、または Backfill で残り回数が
                予約分を下回った
        """
        window = self._windows.setdefault(host, _HostWindow())
        # 待機中も含めてロックを持ち、並行する呼び出しが同じ空きを取り合わないようにする
        async with window.lock:
            while True:
                now = self._clock()
                self._purge(window, now)
                self._check_long_window(window, host, priority)
                wait = self._short_window_wait(window, now)
                if wait <= 0:
                    window.sent.append(now)
                    return
                await self._sleep(wait)

    def _purge(self, window: _HostWindow, now: float) -> None:
        """2分より前の送信時刻を捨てる。"""
        while window.sent and window.sent[0] <= now - _LONG_WINDOW_SECONDS:
            window.sent.popleft()

    def _check_long_window(
        self, window: _HostWindow, host: str, priority: Priority
    ) -> None:
        remaining = self._per_2min - len(window.sent)
        if remaining <= 0:
            raise RateLimitExceeded(host)
        if priority == "backfill" and remaining < self._backfill_reserve:
            raise RateLimitExceeded(host)

    def _short_window_wait(self, window: _HostWindow, now: float) -> float:
        """直近1秒の上限に達していれば、空くまでの待ち時間（秒）を返す。空きがあれば 0。"""
        threshold = now - _SHORT_WINDOW_SECONDS
        recent = [t for t in window.sent if t > threshold]
        if len(recent) < self._per_second:
            return 0.0
        # 直近1秒の中で、空きをつくる送信（上限から数えて最も古いもの）が1秒を過ぎるまで待つ
        blocking = recent[len(recent) - self._per_second]
        return blocking + _SHORT_WINDOW_SECONDS - now


_limiter: RiotRateLimiter | None = None


def get_limiter() -> RiotRateLimiter:
    """設定値から作った共有のレート制限を返す。未作成なら作成する。"""
    global _limiter
    if _limiter is None:
        _limiter = RiotRateLimiter(
            per_second=settings.riot_rate_limit_per_second,
            per_2min=settings.riot_rate_limit_per_2min,
            backfill_reserve=settings.riot_backfill_reserve,
        )
    return _limiter


def set_limiter(limiter: RiotRateLimiter | None) -> None:
    """共有のレート制限を差し替える。None で次回 get_limiter 時に作り直す（テスト用）。"""
    global _limiter
    _limiter = limiter
