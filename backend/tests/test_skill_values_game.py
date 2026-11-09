"""実際のスキルの値のテスト（fixtures は 16.21 の CommunityDragon から抜いたもの）。

値は Meraki Analytics の leveling（16.22）と見比べた。アーゴットの Q・W・E と
ジンクス W は一致。アーリ Q は 16.22 で基本ダメージが +5 されており、
16.21 の bin.json の値（35/60/85/110/135、魔力の 50%）をそのまま期待値にした。

_Requirements: 5.1_
"""

from scripts.skill_values.champion import SpellIndex, solve_spell
from scripts.skill_values.format import format_value
from scripts.skill_values.render import render
from tests.skill_values_helpers import (
    fixture_calculator,
    fixture_spell,
    load_fixture,
)


def value_text(champion: str, spell_id: str, name: str, max_rank: int = 5) -> str:
    calculator = fixture_calculator(champion, spell_id, max_rank)
    return format_value(calculator.value(name))


def test_アーゴット_q_のダメージ() -> None:
    assert (
        value_text("urgot", "UrgotQ", "TotalDamage")
        == "25/70/115/160/205 (+攻撃力の70%)"
    )


def test_アーゴット_q_のスロウは_100_倍して_45_から_65() -> None:
    calculator = fixture_calculator("urgot", "UrgotQ")
    assert render("@SlowAmount*100@", calculator) == "45/50/55/60/65"
    assert value_text("urgot", "UrgotQ", "SlowDuration") == "1.25"


def test_アーゴット_e_のシールドとダメージ() -> None:
    assert (
        value_text("urgot", "UrgotE", "ETotalShieldHealth")
        == "55/75/95/115/135 (+増加攻撃力の135% +増加体力の13.5%)"
    )
    assert (
        value_text("urgot", "UrgotE", "EDamage")
        == "90/120/150/180/210 (+増加攻撃力の100%)"
    )


def test_アーゴット_w_は固定ダメージにランクで変わる割合() -> None:
    assert (
        value_text("urgot", "UrgotW", "DamagePerShot")
        == "12 (+攻撃力の20/23.5/27/30.5/34%)"
    )


def test_アーゴットのパッシブはレベルの範囲で出す() -> None:
    assert value_text("urgot", "UrgotPassive", "ADDamage", 1) == "攻撃力の40〜100%"
    assert value_text("urgot", "UrgotPassive", "PercentHPRatio", 1) == "2〜6%"
    assert value_text("urgot", "UrgotPassive", "PerLegCD", 1) == "30〜2.5"


def test_アリ_q() -> None:
    assert value_text("ahri", "AhriQ", "TotalDamage") == "35/60/85/110/135 (+魔力の50%)"


def test_ジンクス_w() -> None:
    assert (
        value_text("jinx", "JinxW", "TotalDamage")
        == "10/60/110/160/210 (+攻撃力の140%)"
    )
    calculator = fixture_calculator("jinx", "JinxW")
    assert render("@SlowPercent@", calculator) == "40/50/60/70/80"


def test_アーゴット_q_の文全体() -> None:
    strings = {k: v for k, v in load_fixture("lol.stringtable.json")["entries"].items()}
    failures: list[str] = []
    text = solve_spell(fixture_spell("urgot", "UrgotQ"), 5, strings, failures.append)
    assert text == (
        "榴弾を発射して<physicalDamage>25/70/115/160/205 (+攻撃力の70%)の物理ダメージ"
        "</physicalDamage>を与え、1.25秒間45/50/55/60/65%の<status>スロウ効果</status>"
        "を与える。"
    )
    assert failures == []


def test_アーゴットのパッシブの文は参照も置き換わる() -> None:
    bin_data = load_fixture("urgot.bin.json")
    passive = SpellIndex(bin_data).find_passive("Urgot")
    strings = load_fixture("lol.stringtable.json")["entries"]
    text = solve_spell(passive, 1, strings, lambda reason: None)
    assert text is not None
    assert "<spellName>「パージ」</spellName>" in text
    assert (
        "<physicalDamage>攻撃力の40〜100%(+最大体力の2〜6%)の物理ダメージ</physicalDamage>"
        in text
    )
    assert "脚ごとに30〜2.5秒間のクールダウン" in text
