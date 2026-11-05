"""参加者の行から、ビルド要素ごとの選択肢のキーを取り出して集計する。

要素ごとの対象外の行は .kiro/specs/champion-stats/design.md「ビルド要素の選択肢の作り方」に従う。
"""

from collections.abc import Callable

from schemas.champion import BuildElement
from schemas.champion_store import BuildRow
from services.champion.aggregate import aggregate_element
from services.champion.skill_priority import skill_priority

Key = tuple[int, ...]

# スキル順として扱う先頭のレベル数
_SKILL_ORDER_LENGTH = 15

# コアビルドに含める完成アイテムの数
_CORE_ITEM_COUNT = 3


def _skill_priority_key(row: BuildRow) -> Key | None:
    if not row.skill_order:
        return None
    return tuple(skill_priority(row.skill_order))


def _skill_order_key(row: BuildRow) -> Key | None:
    if row.skill_order is None or len(row.skill_order) < _SKILL_ORDER_LENGTH:
        return None
    return tuple(row.skill_order[:_SKILL_ORDER_LENGTH])


def _spells_key(row: BuildRow) -> Key | None:
    return tuple(sorted((row.spell1_id, row.spell2_id)))


def _starting_items_key(row: BuildRow) -> Key | None:
    if row.starting_items is None:
        return None
    return tuple(sorted(row.starting_items))


def _core_items_key(row: BuildRow) -> Key | None:
    items = row.completed_items
    if items is None or len(items) < _CORE_ITEM_COUNT:
        return None
    return tuple(items[:_CORE_ITEM_COUNT])


def _nth_item_key(index: int) -> Callable[[BuildRow], Key | None]:
    """完成アイテムの index 番目（0 始まり）を単体の選択肢にする。"""

    def _key(row: BuildRow) -> Key | None:
        items = row.completed_items
        if items is None or len(items) <= index:
            return None
        return (items[index],)

    return _key


def _runes_key(row: BuildRow) -> Key | None:
    if row.primary_perk_ids is None:
        return None
    return (
        row.primary_style_id,
        *row.primary_perk_ids,
        row.sub_style_id,
        *sorted(row.sub_perk_ids or []),
        *(row.stat_perk_ids or []),
    )


# BuildElement を持つ ChampionBuildResponse のフィールド名 → キーの取り出し方
_EXTRACTORS: dict[str, Callable[[BuildRow], Key | None]] = {
    "skill_priority": _skill_priority_key,
    "skill_order": _skill_order_key,
    "spells": _spells_key,
    "starting_items": _starting_items_key,
    "core_items": _core_items_key,
    "item4": _nth_item_key(3),
    "item5": _nth_item_key(4),
    "item6": _nth_item_key(5),
    "runes": _runes_key,
}


def build_elements(rows: list[BuildRow]) -> dict[str, BuildElement]:
    """全ビルド要素の集計を {フィールド名: BuildElement} で返す。"""
    elements: dict[str, BuildElement] = {}
    for name, extract in _EXTRACTORS.items():
        keyed: list[tuple[Key, bool]] = []
        for row in rows:
            key = extract(row)
            if key is not None:
                keyed.append((key, row.win))
        elements[name] = aggregate_element(keyed)
    return elements
