"""scripts/skill_values/calculate.py の部品ごとのテスト（合成した入力）。

_Requirements: 1.2〜1.4, 2.5.3_
"""

import pytest

from scripts.skill_values.format import format_value
from scripts.skill_values.values import Unsolvable
from tests.skill_values_helpers import (
    data_value,
    game_calc,
    make_calculator,
    named,
    number,
    stat_coef,
)

BASE = data_value("Base", [-99, 10, 20, 30, 40, 50, 60])
RATIO = data_value("Ratio", [-1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6])


def text(calcs: dict, data: list | None = None, name: str = "x") -> str:
    return format_value(make_calculator(calcs, data).value(name))


def test_named_data_value_は_1番目から_maxrank_までを使う() -> None:
    assert text({"x": game_calc(named("Base"))}, [BASE]) == "10/20/30/40/50"


def test_maxrank_が_3_なら_3つだけ使う() -> None:
    calc = make_calculator({"x": game_calc(named("Base"))}, [BASE], max_rank=3)
    assert format_value(calc.value("x")) == "10/20/30"


def test_全ランクで同じ値は_1つだけ出す() -> None:
    same = data_value("Same", [0, 1.25, 1.25, 1.25, 1.25, 1.25, 1.25])
    assert text({"x": game_calc(named("Same"))}, [same]) == "1.25"


def test_data_values_のランクが足りなければ解けない() -> None:
    short = data_value("Short", [0, 1, 2])
    with pytest.raises(Unsolvable):
        text({"x": game_calc(named("Short"))}, [short])


def test_number_は全ランク同じ() -> None:
    assert text({"x": game_calc(number(12))}) == "12"


def test_stat_by_coefficient_は増える分になる() -> None:
    calcs = {"x": game_calc(named("Base"), stat_coef(0.7, mStat=2))}
    assert text(calcs, [BASE]) == "10/20/30/40/50 (+攻撃力の70%)"


def test_mstat_が無ければ魔力() -> None:
    calcs = {"x": game_calc(number(5), stat_coef(0.5))}
    assert text(calcs) == "5 (+魔力の50%)"


def test_stat_by_named_data_value_はランクごとの割合() -> None:
    part = {
        "mStat": 12,
        "mStatFormula": 2,
        "mDataValue": "Ratio",
        "__type": "StatByNamedDataValueCalculationPart",
    }
    assert text({"x": game_calc(part)}, [RATIO]) == "増加体力の10/20/30/40/50%"


def test_複数の増える分は並べる() -> None:
    parts = [stat_coef(0.7, mStat=2, mStatFormula=2), stat_coef(0.15, mStat=12)]
    calcs = {"x": game_calc(number(40), *parts)}
    assert text(calcs) == "40 (+増加攻撃力の70% +最大体力の15%)"


def test_同じステータスの増える分は足してまとめる() -> None:
    calcs = {"x": game_calc(stat_coef(0.5), stat_coef(0.25))}
    assert text(calcs) == "魔力の75%"


def test_sum_of_sub_parts_は中の部品の和() -> None:
    inner = {
        "mSubparts": [number(5), named("Base")],
        "__type": "SumOfSubPartsCalculationPart",
    }
    assert text({"x": game_calc(inner)}, [BASE]) == "15/25/35/45/55"


def test_product_は数だけの部品との積() -> None:
    product = {
        "mPart1": named("Base"),
        "mPart2": number(2),
        "__type": "ProductOfSubPartsCalculationPart",
    }
    assert text({"x": game_calc(product)}, [BASE]) == "20/40/60/80/100"


def test_product_は和の中の積も計算する() -> None:
    inner = {
        "mPart1": named("Base"),
        "mPart2": {
            "mSubparts": [stat_coef(1.0, mStat=2), number(-1)],
            "__type": "SumOfSubPartsCalculationPart",
        },
        "__type": "ProductOfSubPartsCalculationPart",
    }
    outer = {"mSubparts": [inner, number(1)], "__type": "SumOfSubPartsCalculationPart"}
    # (攻撃力 + (-1)) × Base + 1 → 固定の数 -Base + 1、攻撃力の Base 倍
    result = text({"x": game_calc(outer)}, [BASE])
    assert result == "-9/-19/-29/-39/-49 (+攻撃力の1000/2000/3000/4000/5000%)"


def test_ステータス同士の積は解けない() -> None:
    product = {
        "mPart1": stat_coef(1.0, mStat=2),
        "mPart2": stat_coef(1.0, mStat=12),
        "__type": "ProductOfSubPartsCalculationPart",
    }
    with pytest.raises(Unsolvable):
        text({"x": game_calc(product)})


def test_stat_by_subpart_はレベルで変わる割合() -> None:
    sub = {
        "mStartValue": 0.4,
        "mEndValue": 1.0,
        "__type": "ByCharLevelInterpolationCalculationPart",
    }
    part = {"mStat": 2, "mSubpart": sub, "__type": "StatBySubPartCalculationPart"}
    assert text({"x": game_calc(part)}) == "攻撃力の40〜100%"


def test_マナの係数は増えるマナ() -> None:
    part = {
        "mCoefficient": 0.02,
        "mStatFormula": 2,
        "__type": "AbilityResourceByCoefficientCalculationPart",
    }
    assert text({"x": game_calc(number(30), part)}) == "30 (+増加マナの2%)"


def test_マナ以外のリソースは解けない() -> None:
    part = {
        "mCoefficient": 0.02,
        "mAbilityResource": 1,
        "__type": "AbilityResourceByCoefficientCalculationPart",
    }
    with pytest.raises(Unsolvable):
        text({"x": game_calc(part)})


def test_game_calculation_modified_は元の計算に倍率を掛ける() -> None:
    calcs = {
        "base": game_calc(named("Base"), stat_coef(0.5, mStat=2)),
        "x": {
            "mModifiedGameCalculation": "Base",
            "mMultiplier": {
                "mSubparts": [number(1), number(0.5)],
                "__type": "SumOfSubPartsCalculationPart",
            },
            "__type": "GameCalculationModified",
        },
    }
    assert text(calcs, [BASE]) == "15/30/45/60/75 (+攻撃力の75%)"


def test_game_calculation_の_mmultiplier_を掛ける() -> None:
    calcs = {"x": game_calc(named("Base"), mMultiplier=number(0.5))}
    assert text(calcs, [BASE]) == "5/10/15/20/25"


def test_mdisplayaspercent_は_100_倍して百分率にする() -> None:
    ratio = data_value("R", [0, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5])
    calcs = {"x": game_calc(named("R"), mDisplayAsPercent=True)}
    assert text(calcs, [ratio]) == "25/30/35/40/45%"


def test_知らない部品は解けない() -> None:
    calcs = {"x": game_calc({"__type": "SomethingNewCalculationPart"})}
    with pytest.raises(Unsolvable, match="未対応の部品: SomethingNewCalculationPart"):
        text(calcs)


def test_知らない計算は解けない() -> None:
    calcs = {"x": {"__type": "GameCalculationConditional"}}
    with pytest.raises(Unsolvable, match="未対応の計算"):
        text(calcs)


def test_知らない部品が入れ子の中にあっても解けない() -> None:
    inner = {
        "mSubparts": [number(1), {"__type": "Mystery"}],
        "__type": "SumOfSubPartsCalculationPart",
    }
    with pytest.raises(Unsolvable):
        text({"x": game_calc(inner)})


def test_表に無いステータス番号は解けない() -> None:
    calcs = {"x": game_calc(stat_coef(1.0, mStat=99))}
    with pytest.raises(Unsolvable, match="ステータス番号: 99/None"):
        text(calcs)


def test_名前は大文字小文字を区別せず_計算を_data_values_より先に探す() -> None:
    data = [data_value("Dup", [0, 1, 1, 1, 1, 1, 1])]
    calcs = {"dup": game_calc(number(7))}
    assert text(calcs, data, name="DUP") == "7"
    assert text({}, data, name="dUP") == "1"


def test_名前が無ければ解けない() -> None:
    with pytest.raises(Unsolvable, match="名前が見つからない: Nothing"):
        text({}, name="Nothing")


def test_循環した計算は解けない() -> None:
    calcs = {
        "a": {"mModifiedGameCalculation": "b", "__type": "GameCalculationModified"},
        "b": {"mModifiedGameCalculation": "a", "__type": "GameCalculationModified"},
    }
    with pytest.raises(Unsolvable, match="入れ子"):
        text(calcs, name="a")
