"""match-v5 のタイムラインから、参加者ごとのスキル習得順とアイテム購入を求める。"""

from typing import Any

from schemas.riot_fetch import ParticipantTimeline

# 開始アイテムとみなす購入の時刻（ミリ秒、この値を含む）
STARTING_ITEMS_LIMIT_MS = 60_000


def participant_puuids(detail: dict[str, Any]) -> dict[int, str]:
    """試合詳細から {participantId: puuid} を求める。"""
    return {p["participantId"]: p["puuid"] for p in detail["info"]["participants"]}


def convert_timeline(
    timeline: dict[str, Any],
    puuids: dict[int, str],
    completed_ids: frozenset[int],
) -> list[ParticipantTimeline]:
    """タイムラインを参加者ごとのスキル習得順・開始アイテム・完成アイテムにする。

    Args:
        timeline: `/lol/match/v5/matches/{matchId}/timeline` のレスポンス
        puuids: {participantId: puuid}（試合詳細から求める）
        completed_ids: 完成アイテムの itemId（item_catalog で判定したもの）

    Returns:
        puuids の参加者全員分（イベントがなければ空のリスト）

    Raises:
        KeyError, TypeError: レスポンスの形式が想定と異なる場合
    """
    events = [e for f in timeline["info"]["frames"] for e in f["events"]]
    events.sort(key=lambda e: e.get("timestamp", 0))  # 同時刻は元の順を保つ

    skills: dict[int, list[int]] = {pid: [] for pid in puuids}
    purchases: dict[int, list[tuple[int, int]]] = {pid: [] for pid in puuids}
    for event in events:
        pid = event.get("participantId")
        if pid not in puuids:
            continue
        kind = event.get("type")
        if kind == "SKILL_LEVEL_UP" and event.get("levelUpType") == "NORMAL":
            skills[pid].append(event["skillSlot"])
        elif kind == "ITEM_PURCHASED":
            purchases[pid].append((event["itemId"], event["timestamp"]))
        elif kind == "ITEM_UNDO":
            _undo_purchase(purchases[pid], event.get("beforeId"))

    return [
        ParticipantTimeline(
            puuid=puuid,
            skill_order=skills[pid],
            starting_items=[
                item for item, at in purchases[pid] if at <= STARTING_ITEMS_LIMIT_MS
            ],
            completed_items=[
                item for item, _ in purchases[pid] if item in completed_ids
            ],
        )
        for pid, puuid in puuids.items()
    ]


def _undo_purchase(purchases: list[tuple[int, int]], before_id: int | None) -> None:
    """beforeId の直近の購入を取り消す。該当する購入がなければ何もしない。"""
    for i in range(len(purchases) - 1, -1, -1):
        if purchases[i][0] == before_id:
            del purchases[i]
            return
