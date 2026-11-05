"""スキル優先順の算出のテスト: 典型例と、5回に達しないスキルの補い方。

_Requirements: 3.3_
"""

from hypothesis import given, settings
from hypothesis import strategies as st

from services.champion.skill_priority import skill_priority

Q, W, E, R = 1, 2, 3, 4


def test_all_maxed_follows_order_of_reaching_five() -> None:
    """Q→E→W の順に5回目へ達したら Q>E>W（R は無視する）。"""
    order = [Q, W, E] + [Q] * 4 + [R] + [E] * 4 + [W] * 4 + [R]
    assert skill_priority(order) == [Q, E, W]


def test_unreached_skills_follow_in_descending_count() -> None:
    """Q だけが5回に達した場合、残りは習得回数の多い E(4)→W(3) の順。"""
    order = [Q] * 5 + [W] * 3 + [E] * 4
    assert skill_priority(order) == [Q, E, W]


def test_unreached_skills_with_same_count_follow_q_w_e() -> None:
    """5回に達しないスキルが同数なら Q→W→E の順。"""
    assert skill_priority([E, E, W, W, Q, Q]) == [Q, W, E]
    assert skill_priority([E, E, W, W]) == [W, E, Q]


def test_none_reaches_five_uses_counts_only() -> None:
    assert skill_priority([E, E, E, W, W, Q]) == [E, W, Q]


def test_maxed_skill_is_placed_before_more_used_unreached_skill() -> None:
    """5回に達したスキルは、達していないスキルより常に先（回数が同じ5でも）。"""
    order = [W] * 4 + [E] * 5
    assert skill_priority(order) == [E, W, Q]


def test_empty_and_r_only_return_default_order() -> None:
    assert skill_priority([]) == [Q, W, E]
    assert skill_priority([R, R, R]) == [Q, W, E]


@settings(max_examples=100)
@given(st.lists(st.integers(min_value=1, max_value=4), max_size=18))
def test_result_is_always_permutation_of_q_w_e(order: list[int]) -> None:
    assert sorted(skill_priority(order)) == [Q, W, E]
