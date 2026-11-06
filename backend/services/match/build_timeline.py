"""タイムラインから、参加者ごとのアイテムの購入順とスキルの上げ順を求める（純粋関数）。"""

from typing import Any

from schemas.match_detail import ItemPurchaseGroup, ParticipantBuild
from services.champion.skill_priority import skill_priority

_MS_PER_MINUTE = 60_000


def build_participant_builds(
    timeline: dict[str, Any], puuids: dict[int, str]
) -> dict[str, ParticipantBuild]:
    """タイムラインを {puuid: ParticipantBuild} にする。

    - アイテム: ITEM_PURCHASED を分（timestamp // 60000）ごとにまとめる。
      ITEM_UNDO は beforeId（取り消されたアイテム）に一致する直前の購入を1件消す。
      売却（ITEM_SOLD）は購入時点の表示に残すため、何もしない
    - スキル: SKILL_LEVEL_UP のうち levelUpType が NORMAL のもの（EVOLVE は除く）

    Args:
        timeline: `/lol/match/v5/matches/{matchId}/timeline` のレスポンス
        puuids: {participantId: puuid}（試合詳細から求める）

    Returns:
        puuids の参加者全員分（イベントがなければ空のビルド）

    Raises:
        KeyError, TypeError: レスポンスの形式が想定と異なる場合
    """
    events = [e for f in timeline["info"]["frames"] for e in f["events"]]
    events.sort(key=lambda e: e.get("timestamp", 0))  # 同時刻は元の順を保つ

    purchases: dict[int, list[tuple[int, int]]] = {pid: [] for pid in puuids}
    skills: dict[int, list[int]] = {pid: [] for pid in puuids}
    for event in events:
        pid = event.get("participantId")
        if pid not in puuids:
            continue
        kind = event.get("type")
        if kind == "ITEM_PURCHASED":
            purchases[pid].append((event["itemId"], event["timestamp"]))
        elif kind == "ITEM_UNDO":
            _undo_purchase(purchases[pid], event.get("beforeId"))
        elif kind == "SKILL_LEVEL_UP" and event.get("levelUpType") == "NORMAL":
            skills[pid].append(event["skillSlot"])

    return {
        puuid: ParticipantBuild(
            item_purchases=_group_by_minute(purchases[pid]),
            skill_order=skills[pid],
            skill_priority=skill_priority(skills[pid]),
        )
        for pid, puuid in puuids.items()
    }


def _undo_purchase(purchases: list[tuple[int, int]], before_id: int | None) -> None:
    """beforeId のアイテムの直近の購入を1件消す。該当する購入がなければ何もしない。"""
    for i in range(len(purchases) - 1, -1, -1):
        if purchases[i][0] == before_id:
            del purchases[i]
            return


def _group_by_minute(purchases: list[tuple[int, int]]) -> list[ItemPurchaseGroup]:
    """購入（時刻順）を分ごとにまとめる。分は昇順、アイテムは購入順。"""
    groups: list[ItemPurchaseGroup] = []
    for item_id, timestamp in purchases:
        minute = timestamp // _MS_PER_MINUTE
        if groups and groups[-1].minute == minute:
            groups[-1].item_ids.append(item_id)
        else:
            groups.append(ItemPurchaseGroup(minute=minute, item_ids=[item_id]))
    return groups
