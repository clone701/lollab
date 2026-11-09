"""チャンピオン 1 体分の処理: bin.json からスペルを探し、文に値を入れる。"""

import json
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .calculate import Calculator
from .render import FailureHandler, render
from .strings import lookup, resolve_references, strip_icons

# パッシブは 1 ランクだけ（DataValues の values[1]）を使う
PASSIVE_MAX_RANK = 1
PASSIVE_DESCRIPTION_PREFIX = "game_character_passivedescription_"


@dataclass(frozen=True)
class SpellInfo:
    """Data Dragon のスキル（spells[]）。"""

    id: str
    max_rank: int


@dataclass(frozen=True)
class ChampionInfo:
    """Data Dragon のチャンピオン 1 体分。spells は Q/W/E/R の順。"""

    id: str
    spells: list[SpellInfo]


def read_champion_info(path: Path) -> ChampionInfo:
    """`data/ja_JP/champion/<id>.json` を読む。"""
    document = json.loads(path.read_text(encoding="utf-8"))
    data = next(iter(document["data"].values()))
    spells = [SpellInfo(s["id"], int(s["maxrank"])) for s in data["spells"]]
    return ChampionInfo(str(data["id"]), spells)


class SpellIndex:
    """bin.json の `Characters/<名前>/Spells/…` にある mSpell の索引。"""

    def __init__(self, bin_data: Mapping[str, Any]) -> None:
        self._by_name: dict[str, Mapping[str, Any]] = {}
        self._entries: list[tuple[str, Mapping[str, Any]]] = []
        for key, entry in bin_data.items():
            spell = entry.get("mSpell") if isinstance(entry, dict) else None
            if not isinstance(spell, dict):
                continue
            lowered = key.lower()
            self._by_name.setdefault(lowered.rsplit("/", 1)[-1], spell)
            self._entries.append((lowered, spell))

    def find(self, spell_id: str) -> Mapping[str, Any] | None:
        """スペル名（`UrgotQ`）で探す。大文字小文字は区別しない。"""
        return self._by_name.get(spell_id.lower())

    def find_passive(
        self, champion_id: str, strings: Mapping[str, str] | None = None
    ) -> Mapping[str, Any] | None:
        """`<名前>PassiveAbility` の下を探し、無ければ文のキーで探す。

        下に mSpell が複数あるときは、keyTooltip の文が文字列表にあるものを優先する
        （例 アーリは AhriPassiveCounter ではなく AhriPassive）。無ければ最初のもの。
        """
        folder = f"/{champion_id.lower()}passiveability/"
        candidates = [spell for key, spell in self._entries if folder in key]
        if strings is not None:
            for spell in candidates:
                key = _tooltip_key(spell)
                if key and lookup(strings, key) is not None:
                    return spell
        if candidates:
            return candidates[0]
        tooltip_key = f"spell_{champion_id.lower()}passive_tooltip"
        for _, spell in self._entries:
            if _tooltip_key(spell) == tooltip_key:
                return spell
        return None


def _tooltip_key(spell: Mapping[str, Any]) -> str:
    client = spell.get("mClientData") or {}
    keys = (client.get("mTooltipData") or {}).get("mLocKeys") or {}
    return str(keys.get("keyTooltip", "")).lower()


def solve_spell(
    spell: Mapping[str, Any] | None,
    max_rank: int,
    strings: Mapping[str, str],
    on_failure: FailureHandler,
) -> str | None:
    """スペル 1 つの数値入りの文。解けなければ None（理由は on_failure へ）。"""
    if spell is None:
        on_failure("スペルが見つからない")
        return None
    key = _tooltip_key(spell)
    template = lookup(strings, key) if key else None
    if template is None:
        on_failure("文が見つからない")
        return None
    text = resolve_references(template, strings)
    if text is None:
        on_failure("{{参照}}を解決できない")
        return None
    return render(strip_icons(text), Calculator(spell, max_rank), on_failure)


def _passive_description(champion_id: str, strings: Mapping[str, str]) -> str | None:
    """文字列表の `game_character_passivedescription_<名前>`（数値が入った文）。

    `@` が残るもの（値の入っていない文）は使わない。
    """
    template = lookup(strings, f"{PASSIVE_DESCRIPTION_PREFIX}{champion_id}")
    if template is None:
        return None
    text = resolve_references(template, strings)
    if text is None:
        return None
    text = strip_icons(text)
    return None if "@" in text else text


def solve_passive(
    spell: Mapping[str, Any] | None,
    champion_id: str,
    strings: Mapping[str, str],
    on_failure: FailureHandler,
) -> str | None:
    """パッシブの文。スペルの文を計算し、できなければ passivedescription、無ければ None。

    スペルの文が解けなかった理由は、passivedescription も使えなかったときだけ渡す。
    """
    reasons: list[str] = []
    text = solve_spell(spell, PASSIVE_MAX_RANK, strings, reasons.append)
    if text is None:
        text = _passive_description(champion_id, strings)
    if text is None:
        for reason in reasons:
            on_failure(reason)
    return text


@dataclass(frozen=True)
class ChampionResult:
    """パッシブと Q/W/E/R の文（解けないものは None）。"""

    passive: str | None
    spells: list[str | None]


def solve_champion(
    info: ChampionInfo,
    bin_data: Mapping[str, Any] | None,
    strings: Mapping[str, str],
    on_failure: FailureHandler,
) -> ChampionResult:
    """チャンピオン 1 体分を解く。bin.json が無ければ全部 None。"""
    if bin_data is None:
        on_failure("bin.json が見つからない")
        return ChampionResult(None, [None] * len(info.spells))
    index = SpellIndex(bin_data)
    passive = solve_passive(
        index.find_passive(info.id, strings), info.id, strings, on_failure
    )
    spells = [
        solve_spell(index.find(s.id), s.max_rank, strings, on_failure)
        for s in info.spells
    ]
    return ChampionResult(passive, spells)
