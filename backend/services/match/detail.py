"""試合詳細の取得と組み立ての流れ（Riot API は生データがないときだけ呼ぶ）。"""

import logging
from typing import Any

from fastapi import HTTPException
from pydantic import ValidationError

from adapters import match_rank_store, match_store
from schemas.match_detail import MatchDetailResponse, ParticipantBuild
from services.match import raw_source
from services.match.build_timeline import build_participant_builds
from services.match.convert import build_match_detail
from services.summoner.timeline_convert import participant_puuids

logger = logging.getLogger(__name__)

# 生データの形式が想定と異なるときに送出される例外
_FORMAT_ERRORS = (KeyError, IndexError, TypeError, ValueError, ValidationError)


def _builds_of(
    match_id: str, timeline: dict[str, Any] | None, puuids: dict[int, str]
) -> dict[str, ParticipantBuild] | None:
    """タイムラインからビルドを求める。タイムラインがない・変換できなければ None。"""
    if timeline is None:
        return None
    try:
        return build_participant_builds(timeline, puuids)
    except _FORMAT_ERRORS:
        logger.warning(
            "タイムラインを変換できませんでした: %s", match_id, exc_info=True
        )
        return None


async def get_match_detail(match_id: str) -> MatchDetailResponse:
    """試合詳細を返す。

    Args:
        match_id: 試合 ID（形式の検証は呼び出し側）

    Raises:
        HTTPException: 404（DB にない試合）、429（Riot API のレート制限）、
            502（試合詳細を取得・変換できない）
    """
    exists, bundle_key = await match_store.get_raw_bundle_key(match_id)
    if not exists:
        # DB にない試合 ID では Riot API を呼ばない
        raise HTTPException(status_code=404, detail="試合が見つかりません")

    detail, timeline = await raw_source.load_raw(match_id, bundle_key)
    try:
        puuids = participant_puuids(detail)
    except _FORMAT_ERRORS:
        raise _unreadable(match_id) from None
    ranks = await match_rank_store.get_ranks(list(puuids.values()))
    builds = _builds_of(match_id, timeline, puuids)
    try:
        return build_match_detail(detail, ranks, builds)
    except _FORMAT_ERRORS:
        raise _unreadable(match_id) from None


def _unreadable(match_id: str) -> HTTPException:
    """生データを変換できないときの 502。詳細はログだけに残す。"""
    logger.error("試合詳細を変換できませんでした: %s", match_id, exc_info=True)
    return HTTPException(status_code=502, detail="試合詳細を取得できませんでした")
