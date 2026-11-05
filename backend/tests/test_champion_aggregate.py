# Feature: champion-stats, Property: ビルド要素の選択肢集計
"""aggregate_element のプロパティテスト。

**Validates: Requirements 3.1, 3.2, 3.6**
"""

from collections import Counter
from fractions import Fraction

from hypothesis import given, settings
from hypothesis import strategies as st

from services.champion.aggregate import aggregate_element

Rows = list[tuple[tuple[int, ...], bool]]

# キーの種類を絞り、同じキーが複数回現れる（集計が起きる）入力にする
_keys = st.lists(st.integers(min_value=0, max_value=3), max_size=3).map(tuple)
_rows = st.lists(st.tuples(_keys, st.booleans()), max_size=120)


def _totals(rows: Rows) -> dict[tuple[int, ...], tuple[int, int]]:
    games: Counter[tuple[int, ...]] = Counter(key for key, _ in rows)
    wins: Counter[tuple[int, ...]] = Counter(key for key, win in rows if win)
    return {key: (games[key], wins[key]) for key in games}


@settings(max_examples=100)
@given(_rows)
def test_option_games_sum_to_element_games(rows: Rows) -> None:
    """全選択肢を出す設定では、各選択肢の試合数・勝利数の合計が要素の値に一致する。"""
    element = aggregate_element(rows, limit=len(rows) + 1)

    assert element.games == len(rows)
    assert sum(o.games for o in element.options) == element.games
    assert sum(o.wins for o in element.options) == sum(win for _, win in rows)
    assert {tuple(o.key): (o.games, o.wins) for o in element.options} == _totals(rows)


@settings(max_examples=100)
@given(_rows)
def test_options_are_sorted_descending_and_limited_to_ten(rows: Rows) -> None:
    element = aggregate_element(rows)
    games = [o.games for o in element.options]

    assert element.games == len(rows)
    assert len(element.options) <= 10
    assert games == sorted(games, reverse=True)
    # 上位10件に入らなかった選択肢は、入った選択肢より試合数が多くない
    if len(_totals(rows)) > 10:
        shown = {tuple(o.key) for o in element.options}
        hidden = [g for key, (g, _) in _totals(rows).items() if key not in shown]
        assert max(hidden) <= min(games)
    assert sum(games) <= element.games


@settings(max_examples=100)
@given(_rows)
def test_best_win_rate_is_max_over_all_options(rows: Rows) -> None:
    """上位10件に限らず全選択肢から、勝率最大（同率は試合数最大）を選ぶ。"""
    element = aggregate_element(rows)
    totals = _totals(rows)

    if not totals:
        assert element.best_win_rate is None
        return
    best = element.best_win_rate
    assert best is not None
    assert (tuple(best.key) in totals) and totals[tuple(best.key)] == (
        best.games,
        best.wins,
    )

    def score(item: tuple[tuple[int, ...], tuple[int, int]]) -> tuple[Fraction, int]:
        _, (games, wins) = item
        return Fraction(wins, games), games

    top = max(score(item) for item in totals.items())
    assert (Fraction(best.wins, best.games), best.games) == top
    # 同点なら、キーの辞書順で先のもの（決定的）
    tied = [key for key, g_w in totals.items() if score((key, g_w)) == top]
    assert tuple(best.key) == min(tied)


def test_best_win_rate_can_be_outside_the_top_ten() -> None:
    """試合数の少ない選択肢が最高勝率なら、options に含まれなくても best_win_rate に出る。"""
    rows: Rows = []
    for i in range(11):
        rows += [((i,), True), ((i,), False)] * 2  # 勝率 50%、4試合
    rows.append(((99,), True))  # 勝率 100%、1試合
    element = aggregate_element(rows)

    assert all(o.key != [99] for o in element.options)
    assert element.best_win_rate is not None
    assert element.best_win_rate.key == [99]


def test_empty_rows_return_no_data() -> None:
    element = aggregate_element([])

    assert (element.games, element.options, element.best_win_rate) == (0, [], None)
