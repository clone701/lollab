"""% の値に増える分が付く書き方・スタックで増える値・負の数の式のテスト。

_Requirements: 2.6.1, 2.6.2_
"""

import pytest

from scripts.skill_values.format import format_series, format_value
from scripts.skill_values.render import render
from scripts.skill_values.values import Series, Unsolvable
from tests.skill_values_helpers import (
    data_value,
    fixture_calculator,
    game_calc,
    make_calculator,
    named,
    number,
    stat_coef,
)

RATE = data_value("Rate", [0, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5])
STACK = data_value("PerStack", [0, 1, 2, 3, 4, 5, 6])


def text(calcs: dict, data: list | None = None, name: str = "x") -> str:
    return format_value(make_calculator(calcs, data).value(name))


def stack_coef(coefficient: float, buff: str = "Buff") -> dict:
    return {
        "mBuffName": buff,
        "mCoefficient": coefficient,
        "__type": "BuffCounterByCoefficientCalculationPart",
    }


def stack_named(name: str, buff: str = "Buff") -> dict:
    return {
        "mBuffName": buff,
        "mDataValue": name,
        "__type": "BuffCounterByNamedDataValueCalculationPart",
    }


def test_百分率の値に増える分が付くと_100ごとにの書き方になる() -> None:
    calcs = {
        "x": game_calc(number(0.25), stat_coef(0.0004, mStat=0), mDisplayAsPercent=True)
    }
    assert text(calcs) == "25% (+魔力100ごとに4%)"


def test_百分率でランクごとの値と増える分() -> None:
    part = {
        "mStat": 12,
        "mStatFormula": 2,
        "mCoefficient": 0.0002,
        "__type": "StatByCoefficientCalculationPart",
    }
    calcs = {"x": game_calc(named("Rate"), part, mDisplayAsPercent=True)}
    assert text(calcs, [RATE]) == "25/30/35/40/45% (+増加体力100ごとに2%)"


def test_百分率の増える分が複数あれば並べる() -> None:
    parts = [stat_coef(0.0004, mStat=0), stat_coef(0.0008, mStat=6, mStatFormula=2)]
    calcs = {"x": game_calc(number(0.25), *parts, mDisplayAsPercent=True)}
    assert text(calcs) == "25% (+魔力100ごとに4% +増加魔法防御100ごとに8%)"


def test_百分率に_mmultiplier_があれば増える分にも掛かる() -> None:
    calcs = {
        "x": game_calc(
            number(25),
            stat_coef(0.04, mStat=0),
            mMultiplier=number(0.01),
            mDisplayAsPercent=True,
        )
    }
    assert text(calcs) == "25% (+魔力100ごとに4%)"


def test_百分率でステータスだけなら括弧を付けない() -> None:
    calcs = {"x": game_calc(stat_coef(0.0004, mStat=0), mDisplayAsPercent=True)}
    assert text(calcs) == "魔力100ごとに4%"


def test_百分率の増える分がレベルで変われば範囲で出す() -> None:
    sub = {
        "mStartValue": 0.0002,
        "mEndValue": 0.0006,
        "__type": "ByCharLevelInterpolationCalculationPart",
    }
    part = {"mStat": 0, "mSubpart": sub, "__type": "StatBySubPartCalculationPart"}
    calcs = {"x": game_calc(number(0.1), part, mDisplayAsPercent=True)}
    assert text(calcs) == "10% (+魔力100ごとに2〜6%)"


def test_百分率でない値の増える分は今までの書き方() -> None:
    calcs = {"x": game_calc(number(5), stat_coef(0.5))}
    assert text(calcs) == "5 (+魔力の50%)"


def test_スタックの係数は_1スタックにつき() -> None:
    calcs = {"x": game_calc(named("Rate"), stack_coef(1.0))}
    assert text(calcs, [RATE]) == "0.25/0.3/0.35/0.4/0.45 (+1スタックにつき1)"


def test_スタックの_data_values_はランクごとに出す() -> None:
    calcs = {"x": game_calc(number(10), stack_named("PerStack"))}
    assert text(calcs, [STACK]) == "10 (+1スタックにつき1/2/3/4/5)"


def test_スタックだけの値は括弧を付けない() -> None:
    calcs = {"x": game_calc(stack_coef(2.5))}
    assert text(calcs) == "1スタックにつき2.5"


def test_スタックとステータスが並ぶ() -> None:
    calcs = {"x": game_calc(number(30), stat_coef(1.0, mStat=2), stack_coef(1.0))}
    assert text(calcs) == "30 (+攻撃力の100% +1スタックにつき1)"


def test_百分率のスタックは単位が付く() -> None:
    calcs = {"x": game_calc(number(0.35), stack_coef(0.05), mDisplayAsPercent=True)}
    assert text(calcs) == "35% (+1スタックにつき5%)"


def test_スタックにも_mmultiplier_が掛かる() -> None:
    calcs = {
        "x": game_calc(
            named("Rate"),
            stack_named("PerStack"),
            mMultiplier=number(2),
            mDisplayAsPercent=True,
        )
    }
    assert text(calcs, [RATE, STACK]) == (
        "50/60/70/80/90% (+1スタックにつき200/400/600/800/1000%)"
    )


def test_同じバフのスタックはまとめる() -> None:
    calcs = {"x": game_calc(stack_coef(1.0), stack_coef(0.5))}
    assert text(calcs) == "1スタックにつき1.5"


def test_違うバフのスタックが混ざると解けない() -> None:
    calcs = {"x": game_calc(stack_coef(1.0, "A"), stack_coef(1.0, "B"))}
    with pytest.raises(Unsolvable, match="複数のスタック"):
        text(calcs)


def test_スタックの_data_values_が無ければ解けない() -> None:
    with pytest.raises(Unsolvable, match="名前が見つからない: Nothing"):
        text({"x": game_calc(stack_named("Nothing"))})


def test_ガリオ_w_の軽減は魔力100ごとに() -> None:
    calculator = fixture_calculator("galio", "GalioW")
    assert format_value(calculator.value("MagicDamageReduction")) == (
        "25/30/35/40/45% (+魔力100ごとに4% +増加魔法防御100ごとに8%"
        " +増加体力100ごとに1%)"
    )
    assert format_value(calculator.value("PhysicalDamageReduction")) == (
        "12.5/15/17.5/20/22.5% (+魔力100ごとに2% +増加魔法防御100ごとに4%"
        " +増加体力100ごとに0.5%)"
    )


def test_ナサス_q_はスタックで増える() -> None:
    calculator = fixture_calculator("nasus", "NasusQ")
    assert format_value(calculator.value("TotalDamage")) == (
        "30/50/70/90/110 (+攻撃力の100% +1スタックにつき1)"
    )


def test_レベルの範囲はレベル1からレベル18の順で小さい順にしない() -> None:
    falling = Series(tuple(float(30 - n) for n in range(18)), by_level=True)
    rising = Series(tuple(float(10 + n) for n in range(18)), by_level=True)
    assert format_series(falling) == "30〜13"
    assert format_series(rising) == "10〜27"


def test_負の数を掛ける式を読む() -> None:
    slow = data_value("SlowAmount", [0, -0.45, -0.5, -0.55, -0.6, -0.65, -0.7])
    calculator = make_calculator({}, [slow])
    assert render("@SlowAmount*-100@", calculator) == "45/50/55/60/65"


def test_負の数で割る式を読む() -> None:
    calculator = make_calculator({"x": game_calc(number(10))})
    assert render("@x/-4@", calculator) == "-2.5"


def test_負の数を足す式を読む() -> None:
    calculator = make_calculator({"x": game_calc(number(10))})
    assert render("@x+-4@", calculator) == "6"
