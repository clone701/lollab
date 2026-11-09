"""レベルで変わる値（ByCharLevel…の部品）のテスト。

_Requirements: 2.5.3_
"""

import pytest

from scripts.skill_values import levels
from scripts.skill_values.format import format_series
from scripts.skill_values.values import Unsolvable
from tests.skill_values_helpers import (
    data_value,
    game_calc,
    make_calculator,
    named,
    number,
    stat_coef,
)


def test_interpolation_はレベル1からレベル18まで同じ幅で変わる() -> None:
    series = levels.interpolate(20, 105)
    assert series.by_level and len(series.values) == 18
    assert series.values[0] == 20 and series.values[17] == 105
    assert series.values[1] == 25
    assert format_series(series) == "20〜105"


def test_減っていく値はレベル1からレベル18の順に出す() -> None:
    assert format_series(levels.interpolate(30, 10)) == "30〜10"


def test_breakpoints_は区切りのレベルで足す_アーゴットのパッシブのクールダウン() -> (
    None
):
    part = {
        "mLevel1Value": 30.0,
        "mBreakpoints": [
            {"mLevel": 6, "mAdditionalBonusAtThisLevel": -10.0},
            {"mLevel": 9, "mAdditionalBonusAtThisLevel": -10.0},
            {"mLevel": 11, "mAdditionalBonusAtThisLevel": -5.0},
            {"mLevel": 13, "mAdditionalBonusAtThisLevel": -2.5},
        ],
    }
    series = levels.breakpoints(part)
    assert series.values[4] == 30  # レベル5
    assert series.values[5] == 20  # レベル6
    assert series.values[17] == 2.5  # レベル18
    assert format_series(series) == "30〜2.5"


def test_breakpoints_は区切り以降の_1レベルごとの増加を変える() -> None:
    # ダイアナのパッシブ: 20 から 1 レベルごとに +5、7 で +10、12 で +15、17 で +25
    part = {
        "mLevel1Value": 20.0,
        "mInitialBonusPerLevel": 5.0,
        "mBreakpoints": [
            {"mLevel": 7, "mBonusPerLevelAtAndAfter": 10.0},
            {"mLevel": 12, "mBonusPerLevelAtAndAfter": 15.0},
            {"mLevel": 17, "mBonusPerLevelAtAndAfter": 25.0},
        ],
    }
    values = levels.breakpoints(part).values
    assert values[:8] == (20, 25, 30, 35, 40, 45, 55, 65)
    assert values[16:] == (195, 220)


def test_区切りが無ければ1レベルごとの増加だけ足す() -> None:
    part = {"mLevel1Value": 47.0, "mInitialBonusPerLevel": 2.0}
    values = levels.breakpoints(part).values
    assert values[0] == 47 and values[17] == 81


def test_区切りも増加も無ければ一定() -> None:
    assert format_series(levels.breakpoints({"mLevel1Value": 5.0})) == "5"


def test_レベルで変わる値に固定の数を足せる() -> None:
    interpolation = {
        "mStartValue": 100.0,
        "mEndValue": 360.0,
        "__type": "ByCharLevelInterpolationCalculationPart",
    }
    calcs = {"x": game_calc(number(10), interpolation, stat_coef(0.5, mStat=2))}
    calc = make_calculator(calcs)
    value = calc.value("x")
    assert value.base is not None and value.base.by_level
    assert (value.base.values[0], value.base.values[17]) == (110, 370)


def test_ランクごとの値とレベルごとの値は混ぜられない() -> None:
    interpolation = {
        "mStartValue": 1.0,
        "mEndValue": 2.0,
        "__type": "ByCharLevelInterpolationCalculationPart",
    }
    data = [data_value("Base", [0, 1, 2, 3, 4, 5, 6])]
    calcs = {"x": game_calc(named("Base"), interpolation)}
    with pytest.raises(Unsolvable, match="混在"):
        make_calculator(calcs, data).value("x")
