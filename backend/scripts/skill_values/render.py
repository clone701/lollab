"""説明文の `@値@` を計算した値に置き換える。"""

import re
from collections.abc import Callable

from .calculate import Calculator
from .format import format_value
from .values import Series, Unsolvable, Value, multiply_series, offset_value

# 直後の `%` は値の側に付ける（`@X@%` → `8% (+魔力100ごとに4%)`）
PLACEHOLDER = re.compile(r"@([^@\s<>]+)@(%?)")
EXPRESSION = re.compile(r"^([^*/+\-]+?)(?:([*/+\-])(-?\d+(?:\.\d+)?))?$")
MODIFIER_PREFIX = "spellmodifier"

FailureHandler = Callable[[str], None]


def _apply(value: Value, operator: str, number: float) -> Value:
    """名前の後ろの `*数`・`/数`・`+数`・`-数` を計算する。"""
    if operator == "*":
        return multiply_series(value, Series.const(number))
    if operator == "/":
        if number == 0:
            raise Unsolvable("0 で割る")
        return multiply_series(value, Series.const(1 / number))
    if operator == "+":
        return offset_value(value, number)
    return offset_value(value, -number)


def _evaluate(expression: str, calculator: Calculator, percent_suffix: bool) -> str:
    match = EXPRESSION.match(expression)
    if match is None:
        raise Unsolvable(f"式を読めない: {expression}")
    name, operator, number = match.groups()
    if name.lower().startswith(MODIFIER_PREFIX):
        return "%" if percent_suffix else ""
    value = calculator.value(name)
    if operator:
        value = _apply(value, operator, float(number))
    if percent_suffix and not value.percent and not _is_ratio_only(value):
        value = Value(value.base, value.terms, True)
    return format_value(value)


def _is_ratio_only(value: Value) -> bool:
    """ステータスの割合だけの値（`魔力の10%`）。単位の `%` を既に含む。"""
    return value.base is None and not any(t.per_stack for t in value.terms)


def render(
    template: str,
    calculator: Calculator,
    on_failure: FailureHandler | None = None,
) -> str | None:
    """全部の `@値@` を置き換えた文。1 つでも解けなければ None。

    解けなかった値の理由は on_failure に 1 つずつ渡す（集計用）。
    """
    failed = False

    def replace(match: re.Match[str]) -> str:
        nonlocal failed
        try:
            return _evaluate(match.group(1), calculator, bool(match.group(2)))
        except Unsolvable as error:
            failed = True
            if on_failure is not None:
                on_failure(error.reason)
            return match.group(0)

    text = PLACEHOLDER.sub(replace, template)
    return None if failed else text
