"""Backfill・クローラーの締め切り（Lambda の残り時間）の判定。

締め切りは time.monotonic() の値で表す。None は締め切りなし（ローカル実行）。
"""

import time

# 残り時間がこの秒数を切ったら、次のページに進まずに終了する
MARGIN_SECONDS = 30.0


def from_remaining_ms(remaining_ms: int) -> float:
    """Lambda の残り時間（ミリ秒）から、締め切り（monotonic）を求める。"""
    return time.monotonic() + remaining_ms / 1000


def is_near(deadline: float | None, margin: float = MARGIN_SECONDS) -> bool:
    """締め切りまで margin 秒（既定 MARGIN_SECONDS）を切っているか。"""
    return deadline is not None and deadline - time.monotonic() < margin
