"""試合詳細 API 用の生データの読み出し。

読む順: 1試合1ファイル → まとめファイル（見つかれば1試合1ファイルに保存）
→ Riot API（取得したら1試合1ファイルに保存）。
タイムラインだけがない場合は、Riot API からタイムラインだけを取り直す。
"""

import logging
from collections.abc import Awaitable
from typing import Any

from fastapi import HTTPException

from adapters import raw_bundle_store, raw_store
from services.summoner.region import REGIONAL_MAP, region_of_match_id
from services.summoner.riot_errors import RiotRateLimitError, describe_fetch_error
from services.summoner.riot_request import get_riot

logger = logging.getLogger(__name__)

_RATE_LIMIT_DETAIL = "レート制限に達しました。しばらく待ってから再試行してください"
_FETCH_FAILED_DETAIL = "試合詳細を取得できませんでした"


async def _save(saving: Awaitable[None], match_id: str, kind: str) -> None:
    """生データの保存を待つ。失敗してもログに残して続ける。"""
    try:
        await saving
    except Exception:
        logger.warning(
            "生データの保存に失敗しました: %s %s", match_id, kind, exc_info=True
        )


def _host_of(match_id: str) -> str:
    """試合 ID の接頭辞から Riot API のリージョナルホストを求める。"""
    region = region_of_match_id(match_id)
    if region is None:
        logger.warning("試合 ID のリージョンを特定できません: %s", match_id)
        raise HTTPException(status_code=404, detail="試合が見つかりません")
    return REGIONAL_MAP[region]


async def _fetch_detail(match_id: str) -> dict[str, Any]:
    """Riot API から試合詳細を取得する。429 は 429、その他の失敗は 502。"""
    host = _host_of(match_id)
    try:
        detail: dict[str, Any] = await get_riot(
            host, f"/lol/match/v5/matches/{match_id}", priority="interactive"
        )
    except RiotRateLimitError:
        raise HTTPException(status_code=429, detail=_RATE_LIMIT_DETAIL) from None
    except Exception as e:
        logger.error(
            "試合詳細の取得に失敗しました: %s %s", match_id, describe_fetch_error(e)
        )
        raise HTTPException(status_code=502, detail=_FETCH_FAILED_DETAIL) from None
    return detail


async def _fetch_timeline(match_id: str) -> dict[str, Any] | None:
    """Riot API からタイムラインを取得する。取得できなければ None（要件4.3）。"""
    host = _host_of(match_id)
    try:
        timeline: dict[str, Any] = await get_riot(
            host, f"/lol/match/v5/matches/{match_id}/timeline", priority="interactive"
        )
    except Exception as e:
        logger.warning(
            "タイムラインの取得に失敗しました: %s %s", match_id, describe_fetch_error(e)
        )
        return None
    return timeline


async def load_raw(
    match_id: str, bundle_key: str | None
) -> tuple[dict[str, Any], dict[str, Any] | None]:
    """試合の (試合詳細, タイムライン) の生データを返す。タイムラインがなければ None。

    Args:
        match_id: 試合 ID（matches に存在するもの）
        bundle_key: matches.raw_bundle_key（クローラーのまとめファイル。なければ None）

    Raises:
        HTTPException: 429（Riot API のレート制限）、502（試合詳細を取得できない）
    """
    detail = await raw_store.load_detail(match_id)
    timeline = await raw_store.load_timeline(match_id)

    if detail is None and bundle_key:
        detail, bundled_timeline = await raw_bundle_store.find_in_bundle(
            bundle_key, match_id
        )
        if detail is not None:
            await _save(raw_store.save_detail(match_id, detail), match_id, "detail")
            if timeline is None and bundled_timeline is not None:
                timeline = bundled_timeline
                await _save(
                    raw_store.save_timeline(match_id, timeline), match_id, "timeline"
                )

    if detail is None:
        detail = await _fetch_detail(match_id)
        await _save(raw_store.save_detail(match_id, detail), match_id, "detail")

    # タイムラインだけがない場合（試合詳細を Riot API から取得した場合を含む）
    if timeline is None:
        timeline = await _fetch_timeline(match_id)
        if timeline is not None:
            await _save(
                raw_store.save_timeline(match_id, timeline), match_id, "timeline"
            )
    return detail, timeline
