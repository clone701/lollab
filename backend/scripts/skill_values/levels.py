"""レベル 1〜18 で変わる値（ByCharLevel…の部品）の計算。"""

from collections.abc import Mapping
from typing import Any

from .values import MAX_LEVEL, Series

SLOPE_KEY = "mBonusPerLevelAtAndAfter"
STEP_KEY = "mAdditionalBonusAtThisLevel"


def interpolate(start: float, end: float) -> Series:
    """レベル 1 の start からレベル 18 の end まで、1 レベルごとに同じだけ変える。"""
    step = (end - start) / (MAX_LEVEL - 1)
    return Series(tuple(start + step * (n - 1) for n in range(1, MAX_LEVEL + 1)), True)


def _breakpoints(part: Mapping[str, Any]) -> list[Mapping[str, Any]]:
    points = part.get("mBreakpoints") or []
    return sorted(points, key=lambda point: point.get("mLevel", 0))


def breakpoints(part: Mapping[str, Any]) -> Series:
    """レベル 1 の値から、レベルごとの増加を足していく。

    増加は 2 通りある。
    - mBonusPerLevelAtAndAfter: そのレベル以降、1 レベルごとに増える量が変わる
    - mAdditionalBonusAtThisLevel: そのレベルになったときだけ 1 回足す
    mInitialBonusPerLevel は最初の 1 レベルごとの増える量（無ければ 0）。
    """
    initial = float(part.get("mInitialBonusPerLevel", 0.0))
    points = _breakpoints(part)
    # 1 レベルごとの増える量を使う書き方か（キーの無い区切りは「増えなくなる」）
    slope_mode = "mInitialBonusPerLevel" in part or any(SLOPE_KEY in p for p in points)
    value = float(part.get("mLevel1Value", 0.0))
    value += sum(float(p.get(STEP_KEY, 0.0)) for p in points if p.get("mLevel") == 1)
    values = [value]
    for level in range(2, MAX_LEVEL + 1):
        slope = initial
        for point in points:
            if point.get("mLevel", 0) > level:
                break
            if SLOPE_KEY in point or (slope_mode and STEP_KEY not in point):
                slope = float(point.get(SLOPE_KEY, 0.0))
        value += slope
        value += sum(
            float(p.get(STEP_KEY, 0.0)) for p in points if p.get("mLevel") == level
        )
        values.append(value)
    return Series(tuple(values), True)
