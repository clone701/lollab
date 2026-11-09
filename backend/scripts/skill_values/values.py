"""計算結果の値の型と、その演算。

値は「ランクごとの数の列（またはレベル 1〜18 ごとの数の列）」と
「ステータスで増える分の一覧」の組で表す。
"""

from collections.abc import Callable
from dataclasses import dataclass

MAX_LEVEL = 18


class Unsolvable(Exception):
    """計算できない値。reason は集計に使う短い理由（例: 「未対応の部品: X」）。"""

    def __init__(self, reason: str) -> None:
        super().__init__(reason)
        self.reason = reason


@dataclass(frozen=True)
class Series:
    """数の列。by_level が真のときは、レベル 1〜18 の 18 個の値。"""

    values: tuple[float, ...]
    by_level: bool = False

    @staticmethod
    def const(number: float) -> "Series":
        return Series((float(number),))


def _spread(series: Series) -> tuple[float, ...]:
    """レベルごとの列にそろえる。ランクごとの列は混ぜられない。"""
    if series.by_level:
        return series.values
    if len(series.values) == 1:
        return series.values * MAX_LEVEL
    raise Unsolvable("ランクごとの値とレベルごとの値の混在")


def combine(a: Series, b: Series, op: Callable[[float, float], float]) -> Series:
    """2 つの列を要素ごとに計算する。長さ 1 の列はどの長さにも合わせる。"""
    if a.by_level or b.by_level:
        pairs = zip(_spread(a), _spread(b))
        return Series(tuple(op(x, y) for x, y in pairs), True)
    if len(a.values) == 1:
        return Series(tuple(op(a.values[0], y) for y in b.values))
    if len(b.values) == 1:
        return Series(tuple(op(x, b.values[0]) for x in a.values))
    if len(a.values) != len(b.values):
        raise Unsolvable("ランクの数が合わない")
    return Series(tuple(op(x, y) for x, y in zip(a.values, b.values)))


def _add(x: float, y: float) -> float:
    return x + y


def _mul(x: float, y: float) -> float:
    return x * y


@dataclass(frozen=True)
class StatTerm:
    """ステータスで増える分（例: 攻撃力の 70%）。coefficient は割合（0.7）。

    per_stack が真のときは、スタック 1 つにつき増える分（label はバフの名前）。
    coefficient は 1 スタックあたりの数。
    """

    label: str
    coefficient: Series
    per_stack: bool = False


@dataclass(frozen=True)
class Value:
    """base は固定の数（無ければ None）。percent は `%` 付きで出す値。"""

    base: Series | None = None
    terms: tuple[StatTerm, ...] = ()
    percent: bool = False


def add_values(a: Value, b: Value) -> Value:
    """2 つの値の和。同じステータスの増える分はまとめる。"""
    if a.base is None or b.base is None:
        base = a.base or b.base
    else:
        base = combine(a.base, b.base, _add)
    terms = list(a.terms)
    for term in b.terms:
        index = next(
            (
                i
                for i, t in enumerate(terms)
                if (t.label, t.per_stack) == (term.label, term.per_stack)
            ),
            None,
        )
        if index is None:
            terms.append(term)
        else:
            merged = combine(terms[index].coefficient, term.coefficient, _add)
            terms[index] = StatTerm(term.label, merged, term.per_stack)
    if sum(1 for t in terms if t.per_stack) > 1:
        raise Unsolvable("複数のスタックで増える値")
    return Value(base, tuple(terms), a.percent or b.percent)


def multiply_series(value: Value, factor: Series) -> Value:
    """値の全体（固定の数と増える分の割合）に数を掛ける。"""
    base = None if value.base is None else combine(value.base, factor, _mul)
    terms = tuple(
        StatTerm(t.label, combine(t.coefficient, factor, _mul), t.per_stack)
        for t in value.terms
    )
    return Value(base, terms, value.percent)


def multiply_values(a: Value, b: Value) -> Value:
    """2 つの値の積。片方が数だけのときに限る。"""
    if not a.terms and a.base is not None:
        return multiply_series(b, a.base)
    if not b.terms and b.base is not None:
        return multiply_series(a, b.base)
    raise Unsolvable("ステータス同士の積")


def offset_value(value: Value, delta: float) -> Value:
    """固定の数に delta を足す（`@名前+1@` など）。"""
    base = value.base or Series.const(0)
    return Value(combine(base, Series.const(delta), _add), value.terms, value.percent)
