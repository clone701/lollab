"""パッシブの文の候補（スペルの文 → passivedescription → 概要）とアイコンの除去のテスト。

_Requirements: 2.5.5, 2.6.3_
"""

from scripts.skill_values.champion import solve_passive, solve_spell
from scripts.skill_values.strings import strip_icons
from tests.skill_values_helpers import (
    data_value,
    fixture_spell,
    load_fixture,
)

AHRI_DESCRIPTION = (
    "ミニオンまたはモンスターを9体キルすると体力が回復する。"
    "敵チャンピオンからキルまたはアシストを奪うと体力が大幅に回復する。"
)


def spell_with(key: str | None, calcs: dict | None = None) -> dict:
    spell: dict = {
        "DataValues": [data_value("Time", [0, 5])],
        "mSpellCalculations": calcs or {},
    }
    if key is not None:
        spell["mClientData"] = {"mTooltipData": {"mLocKeys": {"keyTooltip": key}}}
    return spell


def solve(spell: dict | None, champion: str, strings: dict) -> tuple[str | None, list]:
    reasons: list[str] = []
    return solve_passive(spell, champion, strings, reasons.append), reasons


def test_アイコンの記号を取り除く() -> None:
    assert strip_icons("クールダウン10秒 %i:cooldown%") == "クールダウン10秒"
    assert strip_icons("<OnHit>%i:OnHit%通常攻撃時効果</OnHit>") == (
        "<OnHit>通常攻撃時効果</OnHit>"
    )


def test_パーセントが重なる形では値の_を残す() -> None:
    assert strip_icons("@ratio*100@%%i:scaleMR%)") == "@ratio*100@%)"
    assert strip_icons("@ttAD*100@% %i:scaleAD%</scaleAD>") == ("@ttAD*100@%</scaleAD>")


def test_アイコンが無い文はそのまま() -> None:
    assert strip_icons("体力が50%未満の敵") == "体力が50%未満の敵"


def test_アイコンはスペルの文にも効く() -> None:
    strings = {"spell_x_tooltip": "@Time@秒 %i:cooldown%の間"}
    text = solve_spell(spell_with("Spell_X_Tooltip"), 1, strings, lambda reason: None)
    assert text == "5秒の間"


def test_パッシブはスペルの文を計算して使う() -> None:
    strings = {
        "spell_x_tooltip": "@Time@秒間",
        "game_character_passivedescription_x": "別の文",
    }
    text, reasons = solve(spell_with("Spell_X_Tooltip"), "X", strings)
    assert text == "5秒間"
    assert reasons == []


def test_スペルが見つからなければ_passivedescription() -> None:
    strings = {"game_character_passivedescription_ahri": AHRI_DESCRIPTION}
    text, reasons = solve(None, "Ahri", strings)
    assert text == AHRI_DESCRIPTION
    assert reasons == []


def test_スペルの文が無ければ_passivedescription() -> None:
    strings = {"game_character_passivedescription_x": "値入りの文"}
    text, reasons = solve(spell_with(None), "X", strings)
    assert text == "値入りの文"
    assert reasons == []


def test_キーが文字列表に無くても_passivedescription() -> None:
    strings = {"game_character_passivedescription_x": "値入りの文"}
    text, _ = solve(spell_with("Spell_Missing_Tooltip"), "X", strings)
    assert text == "値入りの文"


def test_スペルの文が解けなければ_passivedescription_理由は渡さない() -> None:
    strings = {
        "spell_x_tooltip": "@Unknown@秒間",
        "game_character_passivedescription_x": "値入りの文",
    }
    text, reasons = solve(spell_with("Spell_X_Tooltip"), "X", strings)
    assert text == "値入りの文"
    assert reasons == []


def test_スペルの文の参照を解決できなければ_passivedescription() -> None:
    strings = {
        "spell_x_tooltip": "{{Missing}}",
        "game_character_passivedescription_x": "値入りの文",
    }
    text, _ = solve(spell_with("Spell_X_Tooltip"), "X", strings)
    assert text == "値入りの文"


def test_キーは小文字で引く() -> None:
    strings = {"game_character_passivedescription_monkeyking": "ウーコンの文"}
    text, _ = solve(None, "MonkeyKing", strings)
    assert text == "ウーコンの文"


def test_passivedescription_の参照とアイコンは今までと同じ扱い() -> None:
    strings = {
        "game_character_passivedescription_x": "{{Name}}が <b>強化</b>される %i:OnHit%",
        "name": "「パージ」",
    }
    text, _ = solve(None, "X", strings)
    assert text == "「パージ」が <b>強化</b>される"


def test_passivedescription_に_at_が残れば使わず_概要() -> None:
    strings = {"game_character_passivedescription_x": "ダメージ@Amount@"}
    text, reasons = solve(None, "X", strings)
    assert text is None
    assert reasons == ["スペルが見つからない"]


def test_passivedescription_の参照が解けなければ_概要() -> None:
    strings = {"game_character_passivedescription_x": "{{Missing}}"}
    text, _ = solve(None, "X", strings)
    assert text is None


def test_どちらも無ければ_概要で_スペルの理由を渡す() -> None:
    strings = {"spell_x_tooltip": "@Unknown@秒間"}
    text, reasons = solve(spell_with("Spell_X_Tooltip"), "X", strings)
    assert text is None
    assert reasons == ["名前が見つからない: Unknown"]


def test_スペルも文も無ければ理由は_文が見つからない() -> None:
    text, reasons = solve(spell_with(None), "X", {})
    assert text is None
    assert reasons == ["文が見つからない"]


def test_アーリのパッシブは_passivedescription_の実データ() -> None:
    strings = load_fixture("lol.extra.stringtable.json")["entries"]
    text, reasons = solve(None, "Ahri", strings)
    assert text == AHRI_DESCRIPTION
    assert reasons == []


def test_ガリオ_w_の文全体() -> None:
    strings = load_fixture("lol.extra.stringtable.json")["entries"]
    reasons: list[str] = []
    text = solve_spell(fixture_spell("galio", "GalioW"), 5, strings, reasons.append)
    assert reasons == []
    assert text is not None
    assert "12〜8秒間ダメージを受けずにいると" in text
    assert "受ける魔法ダメージを25/30/35/40/45% (+魔力100ごとに4%" in text
    assert "自身が15%の<status>スロウ効果</status>" in text
    assert "@" not in text


def test_ナサス_q_の文のスタック() -> None:
    strings = load_fixture("lol.extra.stringtable.json")["entries"]
    reasons: list[str] = []
    text = solve_spell(fixture_spell("nasus", "NasusQ"), 5, strings, reasons.append)
    assert reasons == []
    assert text is not None
    assert "30/50/70/90/110 (+攻撃力の100% +1スタックにつき1)の物理ダメージ" in text
