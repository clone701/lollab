"""skill_values のテストで使う共通の部品。"""

import json
from pathlib import Path
from typing import Any

from scripts.skill_values.calculate import Calculator
from scripts.skill_values.champion import SpellIndex

FIXTURES = Path(__file__).parent / "fixtures" / "skill_values"


def load_fixture(name: str) -> Any:
    return json.loads((FIXTURES / name).read_text(encoding="utf-8"))


def fixture_spell(champion: str, spell_id: str) -> dict[str, Any]:
    """fixtures の bin.json から mSpell を取り出す。"""
    spell = SpellIndex(load_fixture(f"{champion}.bin.json")).find(spell_id)
    assert spell is not None
    return dict(spell)


def fixture_calculator(champion: str, spell_id: str, max_rank: int = 5) -> Calculator:
    return Calculator(fixture_spell(champion, spell_id), max_rank)


def data_value(name: str, values: list[float]) -> dict[str, Any]:
    """DataValues の 1 項目。values の 0 番目はランクに使われない値。"""
    return {"name": name, "values": values, "__type": "SpellDataValue"}


def game_calc(*parts: dict[str, Any], **extra: Any) -> dict[str, Any]:
    return {"mFormulaParts": list(parts), "__type": "GameCalculation", **extra}


def named(name: str) -> dict[str, Any]:
    return {"mDataValue": name, "__type": "NamedDataValueCalculationPart"}


def number(value: float) -> dict[str, Any]:
    return {"mNumber": value, "__type": "NumberCalculationPart"}


def stat_coef(coefficient: float, **extra: Any) -> dict[str, Any]:
    return {
        "mCoefficient": coefficient,
        "__type": "StatByCoefficientCalculationPart",
        **extra,
    }


def make_calculator(
    calcs: dict[str, Any],
    data: list[dict[str, Any]] | None = None,
    max_rank: int = 5,
) -> Calculator:
    """合成した mSpell から Calculator を作る。"""
    spell = {"DataValues": data or [], "mSpellCalculations": calcs}
    return Calculator(spell, max_rank)
