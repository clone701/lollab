"""scripts/skill_values/format.py のテスト。

_Requirements: 1.2, 1.5_
"""

import pytest

from scripts.skill_values.format import (
    format_number,
    format_percent,
    format_series,
    format_value,
)
from scripts.skill_values.values import Series, StatTerm, Unsolvable, Value


@pytest.mark.parametrize(
    ("number", "expected"),
    [
        (9.5, "9.5"),
        (9.50, "9.5"),
        (25.0, "25"),
        (0.625, "0.63"),
        (1.005, "1.01"),
        (0.4000000059604645, "0.4"),
        (45.00000000000001, "45"),
        (-0.0, "0"),
        (0.001, "0"),
        (-9.0, "-9"),
        (1200.0, "1200"),
    ],
)
def test_小数は第2位で四捨五入して末尾の0を取る(number: float, expected: str) -> None:
    assert format_number(number) == expected


def test_全部同じなら_1つだけ出す() -> None:
    assert format_series(Series((1.25,) * 5)) == "1.25"


def test_違えばスラッシュでつなぐ() -> None:
    assert format_series(Series((25, 70, 115, 160, 205))) == "25/70/115/160/205"


def test_レベルごとの列は最小から最大を波ダッシュでつなぐ() -> None:
    series = Series(tuple(float(20 + n * 80 / 17) for n in range(18)), True)
    assert format_series(series) == "20〜100"


def test_レベルごとの列が全部同じなら_1つ() -> None:
    assert format_series(Series((5.0,) * 18, True)) == "5"


def test_割合は百分率にする() -> None:
    assert format_percent(Series((0.7,))) == "70%"
    assert format_percent(Series((0.2, 0.235, 0.27))) == "20/23.5/27%"


def test_増える分は括弧の中に出す() -> None:
    value = Value(Series((25, 70)), (StatTerm("攻撃力", Series((0.7,))),))
    assert format_value(value) == "25/70 (+攻撃力の70%)"


def test_増える分が複数なら_プラスでつなぐ() -> None:
    terms = (
        StatTerm("増加攻撃力", Series((1.35,))),
        StatTerm("増加体力", Series((0.135,))),
    )
    value = Value(Series((55,)), terms)
    assert format_value(value) == "55 (+増加攻撃力の135% +増加体力の13.5%)"


def test_増える分だけなら括弧なし() -> None:
    value = Value(None, (StatTerm("最大体力", Series((0.02,))),))
    assert format_value(value) == "最大体力の2%"


def test_百分率の値は_パーセントを付ける() -> None:
    assert format_value(Value(Series((25, 30)), percent=True)) == "25/30%"


def test_空の値は解けない() -> None:
    with pytest.raises(Unsolvable):
        format_value(Value())
