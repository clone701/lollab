"""scripts/skill_values/strings.py のテスト。

_Requirements: 2.5.4_
"""

from scripts.skill_values.strings import MAX_DEPTH, lookup, resolve_references

TABLE = {
    "spell_urgotw_name": "パージ",
    "spell_a": "A→{{Spell_B}}",
    "spell_b": "B→{{Spell_C}}",
    "spell_c": "C",
    "spell_d": "D→{{Spell_E}}",
    "spell_e": "E→{{Spell_F}}",
    "spell_f": "F→{{Spell_G}}",
    "spell_g": "G",
    "loop": "{{Loop}}",
}


def test_参照を文字列表の文に置き換える() -> None:
    text = "<spellName>「{{Spell_UrgotW_Name}}」</spellName>で発射する。"
    assert (
        resolve_references(text, TABLE)
        == "<spellName>「パージ」</spellName>で発射する。"
    )


def test_空白の入った参照も置き換える() -> None:
    assert resolve_references("{{ Spell_UrgotW_Name }}", TABLE) == "パージ"


def test_参照が無ければそのまま() -> None:
    assert resolve_references("参照なし", TABLE) == "参照なし"


def test_入れ子の参照を置き換える() -> None:
    assert resolve_references("{{Spell_A}}", TABLE) == "A→B→C"


def test_入れ子は_3回まで() -> None:
    assert MAX_DEPTH == 3
    # A→B→C は参照を 3 回置き換えれば終わる
    assert resolve_references("{{Spell_A}}", TABLE) == "A→B→C"
    # D→E→F→G は 4 回必要なので解けない
    assert resolve_references("{{Spell_D}}", TABLE) is None


def test_循環した参照は解けない() -> None:
    assert resolve_references("{{Loop}}", TABLE) is None


def test_見つからない参照は解けない() -> None:
    assert resolve_references("{{Spell_None_Name}}", TABLE) is None


GAME_MODE_TABLE = {
    # サモナーズリフトは _1（味方を蘇生）、アリーナは _2（パートナー）
    "spell_akshanw_tooltip": "{{ Spell_AkshanW_Tooltip_@GameModeInteger@ }}",
    "spell_akshanw_tooltip_1": "アクシャンは@GoldReward@ゴールドを獲得し味方を蘇生する。",
    "spell_akshanw_tooltip_2": "アクシャンとパートナーは@GoldReward@ゴールドを獲得する。",
    "spell_gangplankqwrapper_tooltip": (
        "{{Spell_GangplankQWrapper_Tooltip_@GameModeInteger@}}"
    ),
    "spell_gangplankqwrapper_tooltip_1": "弾丸を発射する。",
    "spell_gangplankqwrapper_tooltip_2": "弾丸を発射し@CherryRatio*100@%を得る。",
    "spell_nomode_tooltip": "{{Spell_NoMode_Tooltip_@GameModeInteger@}}",
}


def test_GameModeInteger_はサモナーズリフトの値_1_として参照先を決める() -> None:
    assert (
        resolve_references(
            "{{ Spell_AkshanW_Tooltip_@GameModeInteger@ }}", GAME_MODE_TABLE
        )
        == "アクシャンは@GoldReward@ゴールドを獲得し味方を蘇生する。"
    )


def test_GameModeInteger_は空白なしの参照でも置き換える() -> None:
    assert (
        resolve_references(
            GAME_MODE_TABLE["spell_gangplankqwrapper_tooltip"], GAME_MODE_TABLE
        )
        == "弾丸を発射する。"
    )


def test_GameModeInteger_は大文字小文字を区別しない() -> None:
    text = "{{Spell_AkshanW_Tooltip_@gamemodeinteger@}}"
    assert resolve_references(text, GAME_MODE_TABLE) == (
        "アクシャンは@GoldReward@ゴールドを獲得し味方を蘇生する。"
    )


def test_GameModeInteger_の参照先が無ければ解けない() -> None:
    text = GAME_MODE_TABLE["spell_nomode_tooltip"]
    assert resolve_references(text, GAME_MODE_TABLE) is None


def test_キーは大文字小文字を区別しない() -> None:
    assert lookup(TABLE, "SPELL_UrgotW_NAME") == "パージ"
    assert lookup(TABLE, "nothing") is None
