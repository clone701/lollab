"""試合1件の取得: 試合詳細 + タイムラインを取得し、保存用レコードに変換する。

- 試合詳細・タイムラインのレスポンスは、変換前にそのまま生データとして保管する
  （保管の失敗はログに記録するだけで、処理を続ける）
- タイムラインの取得・変換に失敗しても、試合詳細の変換結果は返す
  （timeline_fetched_at は None のまま。補完フェーズで再取得する）
"""

import logging
from collections.abc import Awaitable
from datetime import datetime, timezone
from typing import Any

from adapters import raw_store
from adapters.riot_rate_limiter import Priority
from schemas.riot_fetch import FetchedMatch
from services.summoner import item_catalog
from services.summoner.match_convert import convert_match, patch_of_detail
from services.summoner.riot_errors import RiotRateLimitError, describe_fetch_error
from services.summoner.riot_request import get_riot
from services.summoner.timeline_convert import convert_timeline, participant_puuids

logger = logging.getLogger(__name__)


async def _archive(saving: Awaitable[None], match_id: str, kind: str) -> None:
    """生データの保管を待つ。失敗してもログに記録して続ける。"""
    try:
        await saving
    except Exception:
        logger.warning(
            "生データの保管に失敗しました: %s %s", match_id, kind, exc_info=True
        )


async def _get_detail(
    host: str, match_id: str, priority: Priority, reuse_raw: bool
) -> dict[str, Any]:
    """試合詳細を返す。reuse_raw なら、保管済みの生データがあればそれを使う。"""
    if reuse_raw:
        stored = await raw_store.load_detail(match_id)
        if stored is not None:
            return stored
    detail: dict[str, Any] = await get_riot(
        host, f"/lol/match/v5/matches/{match_id}", priority=priority
    )
    await _archive(raw_store.save_detail(match_id, detail), match_id, "detail")
    return detail


async def _attach_timeline(
    fetched: FetchedMatch, detail: dict[str, Any], timeline: dict[str, Any]
) -> FetchedMatch:
    """タイムラインの計算結果を、参加者の列と timeline_fetched_at に反映する。"""
    patch = patch_of_detail(detail)
    if patch is None:
        raise ValueError("patch")
    completed = await item_catalog.get_completed_items(patch)
    results = {
        t.puuid: t
        for t in convert_timeline(timeline, participant_puuids(detail), completed)
    }
    participants = [
        p.model_copy(
            update={
                "skill_order": results[p.puuid].skill_order,
                "starting_items": results[p.puuid].starting_items,
                "completed_items": results[p.puuid].completed_items,
            }
        )
        for p in fetched.participants
    ]
    match = fetched.match.model_copy(
        update={"timeline_fetched_at": datetime.now(timezone.utc)}
    )
    return fetched.model_copy(update={"match": match, "participants": participants})


async def fetch_match(
    host: str,
    match_id: str,
    priority: Priority,
    *,
    reuse_raw_detail: bool = False,
) -> tuple[FetchedMatch, RiotRateLimitError | None]:
    """試合詳細とタイムラインを取得して変換する。

    Args:
        host: Riot API のリージョナルホスト（例: "asia"）
        match_id: 試合ID
        priority: レート制限の優先度
        reuse_raw_detail: True なら試合詳細を保管済みの生データから読む
            （タイムラインだけ取り直すとき。なければ Riot API から取得する）

    Returns:
        (変換結果, タイムライン取得中に受けた 429)。429 のときは変換結果に
        タイムラインが入らない（詳細は有効）。それ以外のタイムライン失敗は
        変換結果の timeline_error に入り、例外にはしない。

    Raises:
        RiotRateLimitError: 試合詳細の取得で 429 を受けた
        Exception: 試合詳細の取得・変換に失敗した（429 以外）
    """
    detail = await _get_detail(host, match_id, priority, reuse_raw_detail)
    fetched = convert_match(detail)
    try:
        path = f"/lol/match/v5/matches/{match_id}/timeline"
        timeline = await get_riot(host, path, priority=priority)
    except RiotRateLimitError as e:
        return fetched, e
    except Exception as e:
        logger.warning("タイムラインの取得に失敗しました: %s", match_id, exc_info=True)
        return (
            fetched.model_copy(update={"timeline_error": describe_fetch_error(e)}),
            None,
        )

    await _archive(raw_store.save_timeline(match_id, timeline), match_id, "timeline")
    try:
        return await _attach_timeline(fetched, detail, timeline), None
    except Exception as e:
        logger.warning("タイムラインの変換に失敗しました: %s", match_id, exc_info=True)
        return (
            fetched.model_copy(update={"timeline_error": describe_fetch_error(e)}),
            None,
        )
