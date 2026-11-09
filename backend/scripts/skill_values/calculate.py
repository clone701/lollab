"""スペルの GameCalculation を、ランクごと・レベルごとの値にする。"""

import re
from collections.abc import Callable, Mapping
from typing import Any

from . import levels
from .stats import resource_label, stat_label
from .values import (
    Series,
    StatTerm,
    Unsolvable,
    Value,
    add_values,
    multiply_series,
    multiply_values,
)

Part = Mapping[str, Any]
MAX_NESTING = 20
# 古い形式の `@Effect2Amount@`。N は 1〜11（mEffectAmount[N-1]）
EFFECT_AMOUNT = re.compile(r"^effect(\d+)amount$")
MAX_EFFECT_NUMBER = 11


class Calculator:
    """1 つのスペル（mSpell）の値を名前から計算する。"""

    def __init__(self, spell: Mapping[str, Any], max_rank: int) -> None:
        self._max_rank = max_rank
        self._data = {
            str(item["name"]).lower(): item.get("values", [])
            for item in spell.get("DataValues") or []
            if "name" in item
        }
        self._calcs = {
            str(name).lower(): calc
            for name, calc in (spell.get("mSpellCalculations") or {}).items()
        }
        self._effect_amounts = spell.get("mEffectAmount") or []
        self._depth = 0
        self._handlers: dict[str, Callable[[Part], Value]] = {
            "NamedDataValueCalculationPart": self._named,
            "NumberCalculationPart": self._number,
            "StatByCoefficientCalculationPart": self._stat_by_coefficient,
            "StatByNamedDataValueCalculationPart": self._stat_by_named,
            "StatBySubPartCalculationPart": self._stat_by_subpart,
            "BuffCounterByCoefficientCalculationPart": self._stack_by_coefficient,
            "BuffCounterByNamedDataValueCalculationPart": self._stack_by_named,
            "AbilityResourceByCoefficientCalculationPart": self._resource,
            "SumOfSubPartsCalculationPart": self._sum,
            "ProductOfSubPartsCalculationPart": self._product,
            "ByCharLevelInterpolationCalculationPart": self._interpolation,
            "ByCharLevelBreakpointsCalculationPart": self._breakpoints,
        }

    def value(self, name: str) -> Value:
        """名前の値。mSpellCalculations → DataValues → EffectNAmount の順に探す。"""
        key = name.lower()
        if key in self._calcs:
            return self._guarded(self._calculation, self._calcs[key])
        if key in self._data:
            return Value(self._data_series(key))
        effect = EFFECT_AMOUNT.match(key)
        if effect and 1 <= int(effect.group(1)) <= MAX_EFFECT_NUMBER:
            return Value(self._effect_series(name, int(effect.group(1))))
        raise Unsolvable(f"名前が見つからない: {name}")

    def _effect_series(self, name: str, number: int) -> Series:
        """mEffectAmount[N-1].value[1..maxrank]。要素・値が無い、全ランク 0 は解けない。"""
        if number > len(self._effect_amounts):
            raise Unsolvable(f"mEffectAmount に無い: {name}")
        values = (self._effect_amounts[number - 1] or {}).get("value") or []
        if len(values) < self._max_rank + 1:
            raise Unsolvable(f"mEffectAmount の値が無い: {name}")
        series = tuple(float(v) for v in values[1 : self._max_rank + 1])
        if not any(series):
            raise Unsolvable(f"mEffectAmount が全ランク 0: {name}")
        return Series(series)

    def _guarded(self, func: Callable[[Part], Value], node: Part) -> Value:
        """入れ子が深すぎる（循環している）計算を止める。"""
        if self._depth >= MAX_NESTING:
            raise Unsolvable("計算の入れ子が深すぎる")
        self._depth += 1
        try:
            return func(node)
        finally:
            self._depth -= 1

    def _data_series(self, key: str) -> Series:
        """DataValues の values[1..maxrank]。0 番目は使わない。"""
        values = self._data[key]
        if len(values) < self._max_rank + 1:
            raise Unsolvable(f"DataValues のランクが足りない: {key}")
        return Series(tuple(float(v) for v in values[1 : self._max_rank + 1]))

    def _calculation(self, calc: Part) -> Value:
        kind = calc.get("__type")
        if kind == "GameCalculation":
            return self._game_calculation(calc)
        if kind == "GameCalculationModified":
            base = self.value(str(calc.get("mModifiedGameCalculation", "")))
            return multiply_series(base, self._multiplier(calc.get("mMultiplier")))
        raise Unsolvable(f"未対応の計算: {kind}")

    def _game_calculation(self, calc: Part) -> Value:
        parts = calc.get("mFormulaParts") or []
        if not parts:
            raise Unsolvable("部品が無い計算")
        result = self._part(parts[0])
        for part in parts[1:]:
            result = add_values(result, self._part(part))
        if "mMultiplier" in calc:
            result = multiply_series(result, self._multiplier(calc["mMultiplier"]))
        if calc.get("mDisplayAsPercent"):
            result = multiply_series(result, Series.const(100))
            result = Value(result.base, result.terms, True)
        return result

    def _multiplier(self, node: Any) -> Series:
        """mMultiplier は数か、数だけの部品。"""
        if node is None:
            return Series.const(1)
        if isinstance(node, (int, float)):
            return Series.const(node)
        value = self._part(node)
        if value.terms or value.base is None:
            raise Unsolvable("倍率にステータスが含まれる")
        return value.base

    def _part(self, part: Part) -> Value:
        kind = part.get("__type")
        handler = self._handlers.get(str(kind))
        if handler is None:
            raise Unsolvable(f"未対応の部品: {kind}")
        return self._guarded(handler, part)

    @staticmethod
    def _label(part: Part) -> str:
        stat, formula = int(part.get("mStat", 0)), part.get("mStatFormula")
        label = stat_label(stat, formula)
        if label is None:
            raise Unsolvable(f"ステータス番号: {stat}/{formula}")
        return label

    def _named(self, part: Part) -> Value:
        name = str(part.get("mDataValue", "")).lower()
        if name not in self._data:
            raise Unsolvable(f"名前が見つからない: {part.get('mDataValue')}")
        return Value(self._data_series(name))

    @staticmethod
    def _number(part: Part) -> Value:
        return Value(Series.const(part.get("mNumber", 0.0)))

    def _stat_by_coefficient(self, part: Part) -> Value:
        coefficient = Series.const(part["mCoefficient"])
        return Value(None, (StatTerm(self._label(part), coefficient),))

    def _stat_by_named(self, part: Part) -> Value:
        coefficient = self._named(part).base
        if coefficient is None:
            raise Unsolvable("DataValues が空")
        return Value(None, (StatTerm(self._label(part), coefficient),))

    def _stat_by_subpart(self, part: Part) -> Value:
        sub = self._part(part.get("mSubpart") or {})
        if sub.terms or sub.base is None:
            raise Unsolvable("ステータスの割合にステータスが含まれる")
        return Value(None, (StatTerm(self._label(part), sub.base),))

    @staticmethod
    def _stack_by_coefficient(part: Part) -> Value:
        """1 スタックにつき mCoefficient（mBuffName はスタックを数えるバフ）。"""
        coefficient = Series.const(part["mCoefficient"])
        term = StatTerm(str(part.get("mBuffName", "")), coefficient, True)
        return Value(None, (term,))

    def _stack_by_named(self, part: Part) -> Value:
        """1 スタックにつき DataValues の値。"""
        coefficient = self._named(part).base
        if coefficient is None:
            raise Unsolvable("DataValues が空")
        term = StatTerm(str(part.get("mBuffName", "")), coefficient, True)
        return Value(None, (term,))

    @staticmethod
    def _resource(part: Part) -> Value:
        if "mAbilityResource" in part:
            raise Unsolvable("マナ以外のリソース")
        formula = part.get("mStatFormula")
        label = resource_label(formula)
        if label is None:
            raise Unsolvable(f"マナの種類: {formula}")
        coefficient = Series.const(part["mCoefficient"])
        return Value(None, (StatTerm(label, coefficient),))

    def _sum(self, part: Part) -> Value:
        subparts = part.get("mSubparts") or []
        if not subparts:
            raise Unsolvable("部品が無い和")
        result = self._part(subparts[0])
        for sub in subparts[1:]:
            result = add_values(result, self._part(sub))
        return result

    def _product(self, part: Part) -> Value:
        first = self._part(part.get("mPart1") or {})
        second = self._part(part.get("mPart2") or {})
        return multiply_values(first, second)

    @staticmethod
    def _interpolation(part: Part) -> Value:
        series = levels.interpolate(
            float(part.get("mStartValue", 0.0)), float(part.get("mEndValue", 0.0))
        )
        return Value(series)

    @staticmethod
    def _breakpoints(part: Part) -> Value:
        return Value(levels.breakpoints(part))
