"""スキル優先順の算出（純粋関数）。"""

from collections import Counter
from collections.abc import Sequence

# スキル優先順の対象（1=Q, 2=W, 3=E）。4=R は含めない
_BASIC_SKILLS = (1, 2, 3)

# スキルを最大化したとみなす習得回数
_MAXED_COUNT = 5


def skill_priority(skill_order: Sequence[int]) -> list[int]:
    """スキル習得順から、Q/W/E の優先順（3要素）を求める。

    5回目の習得に達したスキルを、達した順に先頭へ並べる。
    達しなかったスキルは習得回数の多い順に続け、同数なら Q→W→E の順にする。

    Args:
        skill_order: スキル習得順（1=Q, 2=W, 3=E, 4=R）

    Returns:
        優先順に並べた [1, 2, 3] の並べ替え
    """
    counts: Counter[int] = Counter()
    maxed: list[int] = []
    for skill in skill_order:
        if skill not in _BASIC_SKILLS:
            continue
        counts[skill] += 1
        if counts[skill] == _MAXED_COUNT:
            maxed.append(skill)

    rest = [skill for skill in _BASIC_SKILLS if skill not in maxed]
    # sorted は安定ソートのため、同数の場合は _BASIC_SKILLS の順（Q→W→E）が保たれる
    rest.sort(key=lambda skill: -counts[skill])
    return maxed + rest
