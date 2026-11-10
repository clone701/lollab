"""古い形式の `@EffectNAmount@`（mSpell.mEffectAmount）のテスト。

fixtures の gangplank は 16.21 の CommunityDragon から GangplankQWrapper だけを抜いたもの。
mEffectAmount は 10 要素で、value は 7 個（0 番目 + ランク 1〜6）。value の無い要素がある。

_Requirements: 2.6.4_
"""

from typing import Any

import pytest

from scripts.skill_values.calculate import Calculator
from scripts.skill_values.champion import solve_spell
from scripts.skill_values.format import format_value
from scripts.skill_values.render import render
from scripts.skill_values.values import Unsolvable
from tests.skill_values_helpers import (
    data_value,
    fixture_calculator,
    fixture_spell,
    game_calc,
    load_fixture,
    number,
)

GANGPLANK_Q = (
    "弾丸を発射し<physicalDamage>10/40/70/100/130 (+攻撃力の100%)の物理ダメージ"
    "</physicalDamage>を与える。このスキルで対象を倒すと、"
    "追加で3/4/5/6/7ゴールドと4/5/6/7/8シルバーサーペントを獲得する。<br><br>"
    "シルバーサーペントはショップで<spellName>「一斉砲撃」</spellName>を"
    "アップグレードする際に使用する。"
)


def amounts(*rows: list[float] | None) -> list[dict[str, Any]]:
    """mEffectAmount。None は value の無い要素。"""
    return [
        (
            {"__type": "SpellEffectAmount"}
            if row is None
            else {"value": row, "__type": "SpellEffectAmount"}
        )
        for row in rows
    ]


def calculator(
    effects: list[dict[str, Any]], max_rank: int = 5, **extra: Any
) -> Calculator:
    return Calculator({"mEffectAmount": effects, **extra}, max_rank)


def text(calc: Calculator, name: str) -> str:
    return format_value(calc.value(name))


def test_ギャングプランク_q_の_effect2amount_と_effect5amount() -> None:
    calc = fixture_calculator("gangplank", "GangplankQWrapper")
    assert text(calc, "Effect2Amount") == "3/4/5/6/7"
    assert text(calc, "Effect5Amount") == "4/5/6/7/8"


def test_ギャングプランク_q_の文が最後まで生成される() -> None:
    strings = load_fixture("gangplank.stringtable.json")["entries"]
    failures: list[str] = []
    result = solve_spell(
        fixture_spell("gangplank", "GangplankQWrapper"), 5, strings, failures.append
    )
    assert result == GANGPLANK_Q
    assert failures == []


def test_value_の_0_番目は使わない() -> None:
    calc = fixture_calculator("gangplank", "GangplankQWrapper")
    # value = [10, 10, 40, 70, 100, 130, 145]
    assert text(calc, "Effect1Amount") == "10/40/70/100/130"


def test_大文字小文字を区別しない() -> None:
    calc = fixture_calculator("gangplank", "GangplankQWrapper")
    assert text(calc, "effect2amount") == text(calc, "EFFECT2AMOUNT") == "3/4/5/6/7"


def test_ランクの数だけ取る() -> None:
    calc = calculator(amounts([0, 1, 2, 3, 4, 5, 6]), max_rank=3)
    assert text(calc, "Effect1Amount") == "1/2/3"


def test_式も今までと同じように読む() -> None:
    calc = calculator(amounts([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6]))
    assert render("@Effect1Amount*100@%", calc) == "10/20/30/40/50%"
    assert render("@Effect1Amount+1@", calc) == "1.1/1.2/1.3/1.4/1.5"


def test_全ランクで同じ値は_1_つだけ出す() -> None:
    calc = calculator(amounts([0, 500, 500, 500, 500, 500, 500]))
    assert text(calc, "Effect1Amount") == "500"


def test_1_から_11_まで引ける() -> None:
    rows: list[list[float] | None] = [[0, n, n, n, n, n, n] for n in range(1, 12)]
    calc = calculator(amounts(*rows))
    assert text(calc, "Effect1Amount") == "1"
    assert text(calc, "Effect11Amount") == "11"


def test_mspellcalculations_と_datavalues_が先() -> None:
    effects = amounts([0, 9, 9, 9, 9, 9, 9], [0, 8, 8, 8, 8, 8, 8])
    data = [data_value("Effect1Amount", [0, 1, 2, 3, 4, 5, 6])]
    calcs = {"effect2amount": game_calc(number(7))}
    calc = calculator(effects, DataValues=data, mSpellCalculations=calcs)
    assert text(calc, "Effect1Amount") == "1/2/3/4/5"
    assert text(calc, "Effect2Amount") == "7"


@pytest.mark.parametrize(
    ("effects", "name", "reason"),
    [
        (amounts([0, 1, 1, 1, 1, 1, 1], None), "Effect2Amount", "値が無い"),
        (amounts([0, 1, 1, 1, 1, 1, 1]), "Effect2Amount", "に無い"),
        (amounts([0, 0, 0, 0, 0, 0, 0]), "Effect1Amount", "全ランク 0"),
        (amounts([7, 0, 0, 0, 0, 0, 9]), "Effect1Amount", "全ランク 0"),
        (amounts([0, 1, 1, 1]), "Effect1Amount", "値が無い"),
        (amounts([0, 1, 1, 1, 1, 1, 1]), "Effect0Amount", "名前が見つからない"),
        (amounts([0, 1, 1, 1, 1, 1, 1]), "Effect12Amount", "名前が見つからない"),
        (amounts(*[None] * 10), "Effect11Amount", "に無い"),
        (amounts([0, 1, 1, 1, 1, 1, 1]), "Effect1AmountX", "名前が見つからない"),
    ],
)
def test_解けない場合(effects: list[dict[str, Any]], name: str, reason: str) -> None:
    with pytest.raises(Unsolvable, match=reason):
        calculator(effects).value(name)


def test_一部のランクだけ_0_なら出す() -> None:
    calc = calculator(amounts([0, 0, 0, 5, 5, 5, 5]))
    assert text(calc, "Effect1Amount") == "0/0/5/5/5"


def test_meffectamount_が無いスペルは解けない() -> None:
    with pytest.raises(Unsolvable, match="mEffectAmount に無い"):
        Calculator({}, 5).value("Effect1Amount")


def test_解けない_effectnamount_があると文は_none_で理由が渡る() -> None:
    calc = calculator(amounts([0, 1, 2, 3, 4, 5, 6], None))
    failures: list[str] = []
    assert render("@Effect1Amount@と@Effect2Amount@", calc, failures.append) is None
    assert len(failures) == 1 and "Effect2Amount" in failures[0]
