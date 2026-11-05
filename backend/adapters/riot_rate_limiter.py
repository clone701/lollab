"""Riot API のレート制限: ホスト単位のスライディングウィンドウで送信回数を数える。

上限は「回数:秒」の窓の組で設定する（RIOT_RATE_LIMITS。任意個）。
- 窓が max_wait 秒以下の上限に達したら、空くまで待ってから送る
- それより長い窓の上限に達したら、待たずに RateLimitExceeded を送出する
- priority="backfill" は、最も長い窓の残り回数が「上限 × backfill_reserve_ratio」を
  下回ったら送らずに RateLimitExceeded を送出する（検索・更新用に残り回数を確保するため）

カウントはプロセス内のメモリで持つ。複数インスタンス・複数ワーカーで動かす場合は
共有ストアが必要（現状は1プロセス）。
"""

import asyncio
import time
from collections import deque
from collections.abc import Awaitable, Callable, Sequence
from typing import Literal

from config import settings

Priority = Literal["interactive", "backfill"]


class RateLimitExceeded(Exception):
    """待てない窓の上限（または Backfill の予約分）に達し、送信できないことを表す。"""

    def __init__(self, host: str) -> None:
        super().__init__(f"Riot API のレート制限に達しました: host={host}")
        self.host = host


class _HostState:
    """ホストごとの、窓ごとの送信時刻（古い順）と、並行アクセスを守るロック。"""

    def __init__(self, window_count: int) -> None:
        self.sent: list[deque[float]] = [deque() for _ in range(window_count)]
        self.lock = asyncio.Lock()


class RiotRateLimiter:
    """ホスト単位のレート制限。時刻取得と待機は差し替えられる（テスト用）。"""

    def __init__(
        self,
        windows: Sequence[tuple[int, float]],
        max_wait: float,
        backfill_reserve_ratio: float,
        clock: Callable[[], float] = time.monotonic,
        sleep: Callable[[float], Awaitable[None]] = asyncio.sleep,
    ) -> None:
        """
        Args:
            windows: (回数, 秒) の組。順不同で、秒は重複しない
            max_wait: この秒数以下の窓は空くまで待ち、より長い窓は例外にする
            backfill_reserve_ratio: Backfill が残す、最も長い窓の上限に対する割合
        """
        if not windows:
            raise ValueError("windows は1つ以上必要です")
        if any(limit <= 0 or seconds <= 0 for limit, seconds in windows):
            raise ValueError("windows の回数と秒は正の数にしてください")
        if len({seconds for _, seconds in windows}) != len(windows):
            raise ValueError("windows の秒が重複しています")
        self._windows = sorted(windows, key=lambda window: window[1])
        self._max_wait = max_wait
        self._backfill_reserve_ratio = backfill_reserve_ratio
        self._clock = clock
        self._sleep = sleep
        self._states: dict[str, _HostState] = {}

    async def acquire(self, host: str, priority: Priority = "interactive") -> None:
        """送信の許可を得て、送信時刻を記録する。

        Raises:
            RateLimitExceeded: max_wait より長い窓の上限に達した、または Backfill で
                最も長い窓の残り回数が予約分を下回った
        """
        state = self._states.setdefault(host, _HostState(len(self._windows)))
        # 待機中も含めてロックを持ち、並行する呼び出しが同じ空きを取り合わないようにする
        async with state.lock:
            while True:
                now = self._clock()
                wait = self._required_wait(state, host, priority, now)
                if wait <= 0:
                    for sent in state.sent:
                        sent.append(now)
                    return
                await self._sleep(wait)

    def _required_wait(
        self, state: _HostState, host: str, priority: Priority, now: float
    ) -> float:
        """送信前に待つ時間（秒）を返す。空きがあれば 0。待てない場合は例外にする。"""
        wait = 0.0
        for (limit, seconds), sent in zip(self._windows, state.sent):
            while sent and sent[0] <= now - seconds:
                sent.popleft()
            if len(sent) < limit:
                continue
            if seconds > self._max_wait:
                raise RateLimitExceeded(host)
            # 窓の中は上限までしか入らないため、先頭が最も古い送信（空きをつくるもの）
            wait = max(wait, sent[0] + seconds - now)
        if priority == "backfill":
            self._check_backfill_reserve(state, host)
        return wait

    def _check_backfill_reserve(self, state: _HostState, host: str) -> None:
        limit, _ = self._windows[-1]
        remaining = limit - len(state.sent[-1])
        if remaining < limit * self._backfill_reserve_ratio:
            raise RateLimitExceeded(host)


_limiter: RiotRateLimiter | None = None


def get_limiter() -> RiotRateLimiter:
    """設定値から作った共有のレート制限を返す。未作成なら作成する。"""
    global _limiter
    if _limiter is None:
        _limiter = RiotRateLimiter(
            windows=settings.riot_rate_limit_windows,
            max_wait=settings.riot_rate_limit_max_wait_seconds,
            backfill_reserve_ratio=settings.riot_backfill_reserve_ratio,
        )
    return _limiter


def set_limiter(limiter: RiotRateLimiter | None) -> None:
    """共有のレート制限を差し替える。None で次回 get_limiter 時に作り直す（テスト用）。"""
    global _limiter
    _limiter = limiter
