"""文字列表の読み取りと、文中の {{参照}} の置き換え。"""

import re
from collections.abc import Mapping

REFERENCE = re.compile(r"\{\{\s*([^{}]+?)\s*\}\}")
ICON = re.compile(r"[ \u3000]?%i:[^%\s]*%")
MAX_DEPTH = 3
GAME_MODE = re.compile(r"@GameModeInteger@", re.IGNORECASE)
# 文字列表の `_1` がサモナーズリフトの説明、`_2` がアリーナ（Cherry）の説明
SUMMONERS_RIFT_GAME_MODE = "1"


def strip_icons(text: str) -> str:
    """アイコンの記号（`%i:scaleAS%`）と、その直前の空白を取り除く。

    `5%%i:scaleAS%` のように % が重なる形では、値の `%` は残す。
    """
    return ICON.sub("", text)


def lookup(table: Mapping[str, str], key: str) -> str | None:
    """キー（大文字小文字は区別しない）の文。無ければ None。"""
    return table.get(key.lower())


def resolve_references(text: str, table: Mapping[str, str]) -> str | None:
    """`{{Spell_UrgotW_Name}}` を文字列表の文に置き換える。

    参照の中の `@GameModeInteger@` は、サモナーズリフトの値（SUMMONERS_RIFT_GAME_MODE）
    として参照先を決める（`Spell_AkshanW_Tooltip_@GameModeInteger@` → `…_1`）。
    入れ子は MAX_DEPTH 回まで。見つからない参照や、回数を超えても残る参照があれば
    None（解けない）。
    """
    for _ in range(MAX_DEPTH):
        if REFERENCE.search(text) is None:
            return text
        missing = False

        def replace(match: re.Match[str]) -> str:
            nonlocal missing
            name = GAME_MODE.sub(SUMMONERS_RIFT_GAME_MODE, match.group(1))
            found = lookup(table, name)
            if found is None:
                missing = True
                return match.group(0)
            return found

        text = REFERENCE.sub(replace, text)
        if missing:
            return None
    return None if REFERENCE.search(text) else text
