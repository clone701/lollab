"""`@X@%` の `%` を値の側に付ける書き方・割合で表すステータス・パッシブのスペルの選び方のテスト。

_Requirements: 2.6.1, 2.6.3_
"""

from scripts.skill_values.champion import (
    ChampionInfo,
    SpellIndex,
    SpellInfo,
    solve_champion,
    solve_passive,
    solve_spell,
)
from scripts.skill_values.format import format_value
from scripts.skill_values.render import render
from tests.skill_values_helpers import (
    data_value,
    game_calc,
    load_fixture,
    make_calculator,
    named,
    number,
    stat_coef,
)

RATE = data_value("Rate", [0, 8, 9, 10, 11, 12])


def stat(stat_id: int, coefficient: float, formula: int | None = None) -> dict:
    part = stat_coef(coefficient, mStat=stat_id)
    if formula is not None:
        part["mStatFormula"] = formula
    return part


def rendered(template: str, calcs: dict, data: list | None = None) -> str | None:
    return render(template, make_calculator(calcs, data))


# --- `@X@%` ---


def test_直後の_パーセントは値の側に付く() -> None:
    calcs = {"x": game_calc(number(8), stat(0, 0.04))}
    assert rendered("最大体力の@x@%の魔法ダメージ", calcs) == (
        "最大体力の8% (+魔力100ごとに4%)の魔法ダメージ"
    )


def test_ランクごとの値でも値の側に付く() -> None:
    calcs = {"x": game_calc(named("Rate"), stat(0, 0.06))}
    assert rendered("@x@%のスロウ", calcs, [RATE]) == (
        "8/9/10/11/12% (+魔力100ごとに6%)のスロウ"
    )


def test_増える分が無ければ今までと同じ() -> None:
    calcs = {"x": game_calc(number(45))}
    assert rendered("@x@%のスロウ", calcs) == "45%のスロウ"


def test_式の後ろに_パーセントが付いても同じ() -> None:
    slow = data_value("SlowAmount", [0, -0.45, -0.5, -0.55, -0.6, -0.65])
    assert rendered("@SlowAmount*-100@%", {}, [slow]) == "45/50/55/60/65%"


def test_直後に_パーセントが無ければ値は変わらない() -> None:
    calcs = {"x": game_calc(number(8), stat(0, 0.04))}
    assert rendered("@x@の魔法ダメージ", calcs) == "8 (+魔力の4%)の魔法ダメージ"


def test_既に百分率の値の後ろの_パーセントは重ねない() -> None:
    calcs = {"x": game_calc(number(0.25), stat(0, 0.0004), mDisplayAsPercent=True)}
    assert rendered("@x@%", calcs) == "25% (+魔力100ごとに4%)"


def test_ステータスだけの値は割合の_パーセントを重ねない() -> None:
    calcs = {"x": game_calc(stat(0, 0.1))}
    assert rendered("最大マナが@x@%増加", calcs) == "最大マナが魔力の10%増加"


def test_スタックで増える値は単位が付く() -> None:
    stack = {
        "mBuffName": "Buff",
        "mCoefficient": 0.03,
        "__type": "BuffCounterByCoefficientCalculationPart",
    }
    calcs = {"x": game_calc(number(5), stack)}
    assert rendered("体力の@x@%", calcs) == "体力の5% (+1スタックにつき0.03%)"


def test_スペルの修飾の_パーセントは残る() -> None:
    assert rendered("5@SpellModifierDescriptionAppend@%", {}) == "5%"


def test_増える分が複数あれば並べる() -> None:
    calcs = {"x": game_calc(number(2), stat(2, 0.025, 2), stat(0, 0.02))}
    assert rendered("@x@%", calcs) == "2% (+増加攻撃力100ごとに2.5% +魔力100ごとに2%)"


# --- 1.0 が 100% のステータス ---


def percent_text(*parts: dict) -> str:
    calcs = {"x": game_calc(number(0.02), *parts, mDisplayAsPercent=True)}
    return format_value(make_calculator(calcs).value("x"))


def test_攻撃速度は_100パーセントごとに() -> None:
    assert percent_text(stat(4, 0.05, 2)) == "2% (+増加攻撃速度100%ごとに5%)"


def test_クリティカル率は_100パーセントごとに() -> None:
    assert percent_text(stat(8, 0.35)) == "2% (+クリティカル率100%ごとに35%)"


def test_攻撃速度の小数() -> None:
    assert percent_text(stat(4, 0.0044, 2)) == "2% (+増加攻撃速度100%ごとに0.44%)"


def test_魔力は今までどおり_100ごとに() -> None:
    assert percent_text(stat(0, 0.0004)) == "2% (+魔力100ごとに4%)"


def test_割合でない値の攻撃速度は今までの書き方() -> None:
    calcs = {"x": game_calc(number(5), stat(4, 0.5, 2))}
    assert format_value(make_calculator(calcs).value("x")) == "5 (+増加攻撃速度の50%)"


# --- パッシブのスペルの選び方 ---


def test_パッシブは文が文字列表にあるスペルを優先する() -> None:
    bin_data = load_fixture("ahri_passive.bin.json")
    strings = load_fixture("lol.extra.stringtable.json")["entries"]
    first = SpellIndex(bin_data).find_passive("Ahri")
    chosen = SpellIndex(bin_data).find_passive("Ahri", strings)
    assert first is not None and "mClientData" not in first
    assert chosen is not None
    assert chosen["mClientData"]["mTooltipData"]["mLocKeys"]["keyTooltip"] == (
        "Buff_AhriP_Tooltip"
    )


def test_アーリのパッシブの文() -> None:
    bin_data = load_fixture("ahri_passive.bin.json")
    strings = load_fixture("lol.extra.stringtable.json")["entries"]
    passive = SpellIndex(bin_data).find_passive("Ahri", strings)
    reasons: list[str] = []
    text = solve_passive(passive, "Ahri", strings, reasons.append)
    assert reasons == []
    assert text is not None
    assert "<healing>35〜95 (+魔力の20%)の体力を回復する</healing>" in text
    assert "<healing>75〜165 (+魔力の30%)の体力を回復する</healing>" in text
    assert "@" not in text


def test_チャンピオン1体分でもアーリのパッシブが解ける() -> None:
    info = ChampionInfo("Ahri", [SpellInfo("AhriQ", 5)])
    strings = load_fixture("lol.extra.stringtable.json")["entries"]
    result = solve_champion(info, load_fixture("ahri_passive.bin.json"), strings, print)
    assert result.passive is not None and "35〜95" in result.passive


def spell_entry(key: str | None) -> dict:
    spell: dict = {"DataValues": [], "mSpellCalculations": {}}
    if key:
        spell["mClientData"] = {"mTooltipData": {"mLocKeys": {"keyTooltip": key}}}
    return {"mSpell": spell}


FOLDER = "Characters/X/Spells/XPassiveAbility/"


def test_文がどれも文字列表に無ければ最初のスペル() -> None:
    bin_data = {FOLDER + "A": spell_entry("Missing_A"), FOLDER + "B": spell_entry(None)}
    index = SpellIndex(bin_data)
    assert index.find_passive("X", {"other": "文"}) is index.find_passive("X")
    found = index.find_passive("X", {"other": "文"})
    assert found is not None
    assert found["mClientData"]["mTooltipData"]["mLocKeys"]["keyTooltip"] == "Missing_A"


def test_文のキーは大文字小文字を区別しない() -> None:
    bin_data = {
        FOLDER + "A": spell_entry(None),
        FOLDER + "B": spell_entry("Buff_X_Tip"),
    }
    found = SpellIndex(bin_data).find_passive("X", {"buff_x_tip": "文"})
    assert found is not None
    assert found["mClientData"]["mTooltipData"]["mLocKeys"]["keyTooltip"] == (
        "Buff_X_Tip"
    )


def test_キーの名前が_passive_tooltip_でなくても選ばれる() -> None:
    bin_data = {
        FOLDER + "A": spell_entry("Spell_X_Other"),
        FOLDER + "B": spell_entry(None),
    }
    found = SpellIndex(bin_data).find_passive("X", {"spell_x_other": "文"})
    assert found is not None
    assert found["mClientData"]["mTooltipData"]["mLocKeys"]["keyTooltip"] == (
        "Spell_X_Other"
    )


def test_フォルダが無ければ文のキーで探す() -> None:
    bin_data = {
        "Characters/X/Spells/Other": spell_entry("Spell_XPassive_Tooltip"),
    }
    found = SpellIndex(bin_data).find_passive("X", {"spell_xpassive_tooltip": "文"})
    assert found is not None


def test_どこにも無ければ_none() -> None:
    assert SpellIndex({}).find_passive("X", {}) is None


# --- ガリオ Q ---


def test_ガリオ_q_の竜巻のダメージ() -> None:
    strings = load_fixture("lol.extra.stringtable.json")["entries"]
    index = SpellIndex(load_fixture("galio.bin.json"))
    reasons: list[str] = []
    text = solve_spell(index.find("GalioQ"), 5, strings, reasons.append)
    assert reasons == []
    assert text is not None
    assert (
        "<magicDamage>最大体力の8% (+魔力100ごとに4%)の魔法ダメージ</magicDamage>"
        in (text)
    )
    assert "70/105/140/175/210 (+魔力の70%)" in text
    assert "%%" not in text and ")%" not in text
