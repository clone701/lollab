"""scripts/skill_values/stats.py のテスト（確定したステータス番号の表）。

_Requirements: 1.3_
"""

import pytest

from scripts.skill_values.stats import STAT_LABELS, resource_label, stat_label

# 確定した表（stats.py の docstring の根拠を参照）
EXPECTED = [
    (0, None, "魔力"),
    (0, 2, "魔力"),
    (1, None, "物理防御"),
    (1, 2, "増加物理防御"),
    (2, None, "攻撃力"),
    (2, 2, "増加攻撃力"),
    (4, None, "攻撃速度"),
    (4, 2, "増加攻撃速度"),
    (6, None, "魔法防御"),
    (6, 2, "増加魔法防御"),
    (7, None, "移動速度"),
    (7, 2, "増加移動速度"),
    (8, None, "クリティカル率"),
    (12, None, "最大体力"),
    (12, 1, "基礎体力"),
    (12, 2, "増加体力"),
]


@pytest.mark.parametrize(("stat", "formula", "label"), EXPECTED)
def test_確定した番号の表(stat: int, formula: int | None, label: str) -> None:
    assert stat_label(stat, formula) == label


def test_表の全行をテストしている() -> None:
    assert {(s, f) for s, f, _ in EXPECTED} == set(STAT_LABELS)


@pytest.mark.parametrize(
    ("stat", "formula"),
    [(99, None), (9, None), (13, None), (2, 1), (0, 1), (12, 3)],
)
def test_表に無い番号は_none(stat: int, formula: int | None) -> None:
    assert stat_label(stat, formula) is None


def test_マナの名前() -> None:
    assert resource_label(None) == "最大マナ"
    assert resource_label(2) == "増加マナ"
    assert resource_label(1) is None
