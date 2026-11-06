"""services/match/build_timeline.py のテスト: 購入順・スキル順（純粋関数）。

_Requirements: 3.2, 3.3
"""

import pytest

from services.match.build_timeline import build_participant_builds
from tests.match_helpers import event, timeline_of

PUUIDS = {1: "puuid-a", 2: "puuid-b"}


def _purchase(pid: int, item: int, ms: int) -> dict:
    return event("ITEM_PURCHASED", pid, ms, itemId=item)


def _undo(pid: int, before: int, ms: int) -> dict:
    return event("ITEM_UNDO", pid, ms, beforeId=before, afterId=0)


def _skill(pid: int, slot: int, ms: int, kind: str = "NORMAL") -> dict:
    return event("SKILL_LEVEL_UP", pid, ms, skillSlot=slot, levelUpType=kind)


def test_purchases_are_grouped_by_minute_in_purchase_order() -> None:
    timeline = timeline_of(
        [
            _purchase(1, 1055, 5_000),
            _purchase(1, 2003, 6_000),
            _purchase(1, 1001, 59_999),
            _purchase(1, 3006, 60_000),
            _purchase(1, 3157, 605_000),
        ]
    )

    build = build_participant_builds(timeline, PUUIDS)["puuid-a"]

    assert [(g.minute, g.item_ids) for g in build.item_purchases] == [
        (0, [1055, 2003, 1001]),
        (1, [3006]),
        (10, [3157]),
    ]


def test_undo_removes_the_latest_matching_purchase() -> None:
    timeline = timeline_of(
        [
            _purchase(1, 1055, 5_000),
            _purchase(1, 2003, 6_000),
            _purchase(1, 1055, 7_000),
            _undo(1, 1055, 8_000),
        ]
    )

    build = build_participant_builds(timeline, PUUIDS)["puuid-a"]

    # 直前の 1055（7秒）だけが消え、最初の 1055 は残る
    assert [(g.minute, g.item_ids) for g in build.item_purchases] == [(0, [1055, 2003])]


def test_undo_matches_by_before_id_not_by_last_purchase() -> None:
    timeline = timeline_of(
        [_purchase(1, 1055, 5_000), _purchase(1, 2003, 6_000), _undo(1, 1055, 7_000)]
    )

    build = build_participant_builds(timeline, PUUIDS)["puuid-a"]

    assert build.item_purchases[0].item_ids == [2003]


def test_undo_without_matching_purchase_is_ignored() -> None:
    timeline = timeline_of([_purchase(1, 1055, 5_000), _undo(1, 9999, 6_000)])

    build = build_participant_builds(timeline, PUUIDS)["puuid-a"]

    assert build.item_purchases[0].item_ids == [1055]


def test_undone_only_purchase_leaves_no_empty_group() -> None:
    timeline = timeline_of([_purchase(1, 1055, 5_000), _undo(1, 1055, 6_000)])

    build = build_participant_builds(timeline, PUUIDS)["puuid-a"]

    assert build.item_purchases == []


def test_sold_items_stay_in_purchase_history() -> None:
    sold = event("ITEM_SOLD", 1, 9_000, itemId=1055)
    timeline = timeline_of([_purchase(1, 1055, 5_000), sold])

    build = build_participant_builds(timeline, PUUIDS)["puuid-a"]

    assert build.item_purchases[0].item_ids == [1055]


def test_events_are_ordered_by_timestamp_across_frames() -> None:
    timeline = timeline_of([_purchase(1, 3006, 70_000), _purchase(1, 1055, 5_000)])

    build = build_participant_builds(timeline, PUUIDS)["puuid-a"]

    assert [g.item_ids for g in build.item_purchases] == [[1055], [3006]]


def test_skill_order_uses_normal_level_ups_only() -> None:
    timeline = timeline_of(
        [
            _skill(1, 1, 10_000),
            _skill(1, 2, 80_000),
            _skill(1, 1, 90_000, "EVOLVE"),
            _skill(1, 3, 150_000),
        ]
    )

    build = build_participant_builds(timeline, PUUIDS)["puuid-a"]

    assert build.skill_order == [1, 2, 3]


def test_skill_priority_reuses_champion_logic() -> None:
    order = [1, 2, 3, 1, 1, 4, 1, 1] + [2] * 5
    timeline = timeline_of([_skill(1, s, 1000 * i) for i, s in enumerate(order)])

    build = build_participant_builds(timeline, PUUIDS)["puuid-a"]

    # Q が先に5回、W が次に5回、E は1回
    assert build.skill_priority == [1, 2, 3]


def test_participants_are_separated_and_unknown_ids_ignored() -> None:
    timeline = timeline_of(
        [_purchase(1, 1055, 5_000), _purchase(2, 2003, 5_000), _purchase(99, 1, 0)]
    )

    builds = build_participant_builds(timeline, PUUIDS)

    assert set(builds) == {"puuid-a", "puuid-b"}
    assert builds["puuid-a"].item_purchases[0].item_ids == [1055]
    assert builds["puuid-b"].item_purchases[0].item_ids == [2003]


def test_participant_without_events_gets_empty_build() -> None:
    build = build_participant_builds(timeline_of([]), PUUIDS)["puuid-b"]

    assert build.item_purchases == []
    assert build.skill_order == []


def test_malformed_timeline_raises_key_error() -> None:
    with pytest.raises(KeyError):
        build_participant_builds({"info": {}}, PUUIDS)
