"""scripts/skill_values/render.py のテスト。

_Requirements: 1.1, 1.4, 1.6, 2.1, 2.2_
"""

from scripts.skill_values.render import render
from tests.skill_values_helpers import (
    data_value,
    game_calc,
    make_calculator,
    named,
    stat_coef,
)

DATA = [
    data_value("SlowAmount", [0, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65]),
    data_value("BaseDamage", [0, 25, 70, 115, 160, 205, 250]),
    data_value("Duration", [0, 2, 2, 2, 2, 2, 2]),
]
CALCS = {"TotalDamage": game_calc(named("BaseDamage"), stat_coef(0.7, mStat=2))}


def run(template: str, failures: list[str] | None = None) -> str | None:
    calculator = make_calculator(CALCS, DATA)
    return render(template, calculator, None if failures is None else failures.append)


def test_名前を計算した値に置き換える() -> None:
    assert run("@Duration@秒") == "2秒"
    assert (
        run("@TotalDamage@のダメージ") == "25/70/115/160/205 (+攻撃力の70%)のダメージ"
    )


def test_大文字小文字を区別しない() -> None:
    assert run("@totaldamage@") == run("@TOTALDAMAGE@") == run("@TotalDamage@")


def test_掛け算() -> None:
    assert run("@SlowAmount*100@%") == "40/45/50/55/60%"


def test_割り算() -> None:
    assert run("@BaseDamage/5@") == "5/14/23/32/41"


def test_足し算と引き算() -> None:
    assert run("@Duration+1@") == "3"
    assert run("@Duration-0.5@") == "1.5"


def test_スペル修飾の説明は空にする() -> None:
    assert run("効果。@SpellModifierDescriptionAppend@") == "効果。"
    assert run("@spellmodifierdescriptionappend@") == ""


def test_タグはそのまま残る() -> None:
    template = "<physicalDamage>@TotalDamage@の物理ダメージ</physicalDamage><br>"
    assert run(template) == (
        "<physicalDamage>25/70/115/160/205 (+攻撃力の70%)の物理ダメージ"
        "</physicalDamage><br>"
    )


def test_値の無い文はそのまま返す() -> None:
    assert run("値を含まない文。") == "値を含まない文。"


def test_1つでも解けなければ_none_で_理由を全部渡す() -> None:
    failures: list[str] = []
    assert run("@Duration@秒 @Missing1@ @Missing2@", failures) is None
    assert failures == [
        "名前が見つからない: Missing1",
        "名前が見つからない: Missing2",
    ]


def test_0_で割る式は解けない() -> None:
    failures: list[str] = []
    assert run("@Duration/0@", failures) is None
    assert failures == ["0 で割る"]


def test_on_failure_が無くても_none_を返す() -> None:
    assert run("@Missing@") is None
