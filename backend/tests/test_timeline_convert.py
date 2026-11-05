"""timeline_convert のユニットテスト: スキル順・開始アイテム・完成アイテムの計算。

_Requirements: 4.6_
"""

from typing import Any

from services.summoner.timeline_convert import convert_timeline, participant_puuids
from tests.riot_fetch_helpers import match_detail

PUUIDS = {1: "puuid-a", 2: "puuid-b"}
COMPLETED = frozenset({3157, 3020, 3006})


def _timeline(*frames: list[dict[str, Any]]) -> dict[str, Any]:
    return {"info": {"frames": [{"events": events} for events in frames]}}


def _buy(pid: int, item: int, at: int) -> dict[str, Any]:
    return {
        "type": "ITEM_PURCHASED",
        "participantId": pid,
        "itemId": item,
        "timestamp": at,
    }


def _undo(pid: int, before: int, at: int) -> dict[str, Any]:
    return {
        "type": "ITEM_UNDO",
        "participantId": pid,
        "beforeId": before,
        "afterId": 0,
        "timestamp": at,
    }


def _skill(pid: int, slot: int, at: int, kind: str = "NORMAL") -> dict[str, Any]:
    return {
        "type": "SKILL_LEVEL_UP",
        "participantId": pid,
        "skillSlot": slot,
        "levelUpType": kind,
        "timestamp": at,
    }


def _convert(*frames: list[dict[str, Any]]) -> dict[str, Any]:
    result = convert_timeline(_timeline(*frames), PUUIDS, COMPLETED)
    return {t.puuid: t for t in result}


def test_participant_puuids_maps_participant_id() -> None:
    mapping = participant_puuids(match_detail())

    assert mapping[1] == "puuid-0" and mapping[10] == "puuid-9"


def test_skill_order_uses_normal_level_ups_only_per_participant() -> None:
    """NORMAL の skillSlot だけを、参加者ごとにイベント順で並べる。"""
    result = _convert(
        [_skill(1, 1, 100), _skill(2, 2, 200), _skill(1, 2, 300, "EVOLVE")],
        [_skill(1, 3, 400), _skill(1, 1, 500), _skill(2, 1, 600)],
    )

    assert result["puuid-a"].skill_order == [1, 3, 1]
    assert result["puuid-b"].skill_order == [2, 1]


def test_starting_items_are_purchases_within_60_seconds_inclusive() -> None:
    result = _convert(
        [_buy(1, 1055, 1000), _buy(1, 2003, 60_000), _buy(1, 1001, 60_001)]
    )

    assert result["puuid-a"].starting_items == [1055, 2003]


def test_undo_removes_the_latest_purchase_of_that_item() -> None:
    """ITEM_UNDO は beforeId の直近の購入を取り消す（開始アイテム・完成アイテムとも）。"""
    result = _convert(
        [_buy(1, 1055, 1000), _buy(1, 2003, 2000), _buy(1, 2003, 3000)],
        [_undo(1, 2003, 4000), _buy(1, 3157, 100_000), _buy(1, 3020, 200_000)],
        [_undo(1, 3020, 210_000)],
    )

    assert result["puuid-a"].starting_items == [1055, 2003]
    assert result["puuid-a"].completed_items == [3157]


def test_undo_without_matching_purchase_is_ignored() -> None:
    result = _convert([_buy(1, 1055, 1000), _undo(1, 9999, 2000), _undo(1, 0, 3000)])

    assert result["puuid-a"].starting_items == [1055]


def test_completed_items_keep_purchase_order_and_duplicates() -> None:
    """完成アイテムは購入順。重複購入はそのまま、素材・消耗品は含めない。"""
    result = _convert(
        [_buy(1, 1055, 500), _buy(1, 3020, 300_000), _buy(1, 2003, 310_000)],
        [_buy(1, 3157, 900_000), _buy(1, 3020, 1_000_000)],
    )

    assert result["puuid-a"].completed_items == [3020, 3157, 3020]


def test_events_are_ordered_by_timestamp_across_frames() -> None:
    """フレームの順ではなく timestamp の順で処理する（購入より前の取り消しは無効）。"""
    result = _convert([_buy(1, 3157, 9000)], [_undo(1, 3157, 5000)])

    assert result["puuid-a"].completed_items == [3157]


def test_participants_without_events_get_empty_lists() -> None:
    """イベントのない参加者も空のリストで返す。未知の participantId は無視する。"""
    result = _convert([_buy(1, 3157, 100_000), _buy(99, 3157, 100_000)])

    assert set(result) == {"puuid-a", "puuid-b"}
    assert result["puuid-b"].skill_order == []
    assert result["puuid-b"].starting_items == []
    assert result["puuid-b"].completed_items == []
