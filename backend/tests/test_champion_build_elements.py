"""ビルド要素の選択肢のキーと対象外の行のテスト。

_Requirements: 3.2〜3.6_
"""

from schemas.champion_store import BuildRow
from services.champion.build_elements import build_elements
from tests.champion_helpers import build_row


def _keys(rows: list[BuildRow], name: str) -> list[list[int]]:
    return [o.key for o in build_elements(rows)[name].options]


def test_keys_of_a_typical_row() -> None:
    rows = [build_row(spell1_id=14, spell2_id=4)]

    assert _keys(rows, "skill_priority") == [[1, 2, 3]]
    assert _keys(rows, "skill_order") == [[1, 2, 3] + [1] * 12]
    assert _keys(rows, "spells") == [[4, 14]]
    assert _keys(rows, "starting_items") == [[1055, 2003]]
    assert _keys(rows, "core_items") == [[3157, 3089, 3135]]
    assert _keys(rows, "item4") == [[3020]]
    assert _keys(rows, "item5") == [[3165]]
    assert _keys(rows, "item6") == [[3040]]
    assert _keys(rows, "runes") == [
        [8100, 8112, 8126, 8138, 8135, 8200, 8234, 8236, 5008, 5008, 5002]
    ]


def test_starting_items_are_sorted() -> None:
    assert _keys([build_row(starting_items=[2003, 1055])], "starting_items") == [
        [1055, 2003]
    ]


def test_rows_without_skill_order_are_excluded() -> None:
    elements = build_elements([build_row(skill_order=None), build_row()])

    assert elements["skill_priority"].games == 1
    assert elements["skill_order"].games == 1
    assert elements["spells"].games == 2


def test_skill_order_needs_fifteen_levels() -> None:
    rows = [build_row(skill_order=[1, 2, 3] + [1] * 11)]
    elements = build_elements(rows)

    assert elements["skill_order"].games == 0
    assert elements["skill_priority"].games == 1


def test_core_and_nth_items_need_enough_completed_items() -> None:
    elements = build_elements([build_row(completed_items=[3157, 3089, 3135, 3020])])

    assert elements["core_items"].games == 1
    assert elements["item4"].games == 1
    assert elements["item5"].games == 0
    assert elements["item6"].games == 0
    assert (
        build_elements([build_row(completed_items=[3157, 3089])])["core_items"].games
        == 0
    )
    assert build_elements([build_row(completed_items=None)])["item4"].games == 0


def test_null_starting_items_excluded_but_empty_list_is_an_option() -> None:
    elements = build_elements(
        [build_row(starting_items=None), build_row(starting_items=[])]
    )

    assert elements["starting_items"].games == 1
    assert elements["starting_items"].options[0].key == []


def test_rows_without_primary_perks_are_excluded_from_runes() -> None:
    elements = build_elements([build_row(primary_perk_ids=None), build_row()])

    assert elements["runes"].games == 1


def test_wins_are_counted_per_option() -> None:
    rows = [build_row(win=True), build_row(win=False), build_row(win=True)]
    option = build_elements(rows)["core_items"].options[0]

    assert (option.games, option.wins) == (3, 2)


def test_no_rows_give_empty_elements() -> None:
    for element in build_elements([]).values():
        assert (element.games, element.options, element.best_win_rate) == (0, [], None)
