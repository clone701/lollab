"""試合1件の取得（詳細 + タイムライン）のテスト。Riot API・ストレージ・Data Dragon はモック。

_Requirements: 4.6, 4.8_
"""

import asyncio
from typing import Any
from unittest.mock import AsyncMock, patch

import pytest

from adapters import ddragon, raw_store
from schemas.riot_fetch import MatchDetailsResult
from services.summoner.riot_fetch import RiotRateLimitError, fetch_match_details
from tests.riot_fetch_helpers import (
    GET,
    is_timeline_path,
    match_detail,
    match_id_of,
    status_error,
)

# タイムライン: participantId 1（puuid-0）が開始アイテム、スキル、完成アイテムを購入
TIMELINE = {
    "info": {
        "frames": [
            {
                "events": [
                    {
                        "type": "ITEM_PURCHASED",
                        "participantId": 1,
                        "itemId": 1055,
                        "timestamp": 5000,
                    },
                    {
                        "type": "SKILL_LEVEL_UP",
                        "participantId": 1,
                        "skillSlot": 2,
                        "levelUpType": "NORMAL",
                        "timestamp": 20000,
                    },
                    {
                        "type": "ITEM_PURCHASED",
                        "participantId": 1,
                        "itemId": 3157,
                        "timestamp": 700000,
                    },
                ]
            }
        ]
    }
}


def _fetch(get: Any, ids: list[str] | None = None, **kwargs: Any) -> MatchDetailsResult:
    with patch(GET, new=get):
        return asyncio.run(fetch_match_details("JP", ids or ["JP1_1"], **kwargs))


def _ok_get(timeline_error: Exception | None = None) -> Any:
    async def get(host: str, path: str, params: Any = None, priority: str = "x") -> Any:
        if is_timeline_path(path):
            if timeline_error:
                raise timeline_error
            return TIMELINE
        return match_detail(match_id_of(path))

    return get


def test_fetch_returns_detail_and_timeline_results() -> None:
    """詳細とタイムラインの両方を取得し、参加者ごとの計算結果と記録日時を入れる。"""
    result = _fetch(_ok_get())

    fetched = result.fetched[0]
    assert fetched.match.timeline_fetched_at is not None
    assert fetched.timeline_error is None
    first, second = fetched.participants[0], fetched.participants[1]
    assert first.skill_order == [2]
    assert first.starting_items == [1055]
    assert first.completed_items == [3157]
    # イベントのない参加者は空のリスト（未取得の None ではない）
    assert second.skill_order == [] and second.completed_items == []
    assert len(fetched.bans) == 2


def test_requests_use_given_priority_for_both_endpoints() -> None:
    """詳細とタイムラインの両方が、渡した priority でレート制限に乗る。"""
    seen: list[tuple[str, str]] = []

    async def get(host: str, path: str, params: Any = None, priority: str = "x") -> Any:
        seen.append((path, priority))
        return await _ok_get()(host, path, params, priority)

    _fetch(get, priority="backfill")

    assert seen == [
        ("/lol/match/v5/matches/JP1_1", "backfill"),
        ("/lol/match/v5/matches/JP1_1/timeline", "backfill"),
    ]


def test_timeline_failure_keeps_detail_without_timeline_fetched_at() -> None:
    """タイムライン失敗（429 以外）でも詳細は返り、timeline_fetched_at は None のまま。"""
    result = _fetch(_ok_get(status_error(404)), ["JP1_1", "JP1_2"])

    assert [f.match.match_id for f in result.fetched] == ["JP1_1", "JP1_2"]
    assert result.failures == []
    for fetched in result.fetched:
        assert fetched.match.timeline_fetched_at is None
        assert fetched.timeline_error == "HTTP 404"
        assert fetched.match.detail_version == 2
        assert all(p.skill_order is None for p in fetched.participants)


def test_timeline_convert_failure_is_recorded_as_timeline_error() -> None:
    """タイムラインの形式が不正でも、詳細は残してエラー内容だけ記録する。"""

    async def get(host: str, path: str, params: Any = None, priority: str = "x") -> Any:
        return {} if is_timeline_path(path) else match_detail(match_id_of(path))

    fetched = _fetch(get).fetched[0]

    assert fetched.timeline_error == "KeyError"
    assert fetched.match.timeline_fetched_at is None


def test_item_catalog_failure_is_recorded_as_timeline_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Data Dragon が取得できなければ、完成アイテムを誤って空にせずタイムライン失敗にする。"""
    monkeypatch.setattr(ddragon, "fetch_versions", AsyncMock(side_effect=OSError()))

    fetched = _fetch(_ok_get()).fetched[0]

    assert fetched.timeline_error == "OSError"
    assert fetched.match.timeline_fetched_at is None


def test_timeline_429_keeps_detail_and_stops_remaining_matches() -> None:
    """タイムラインで 429 を受けたら、その試合の詳細を fetched に残して終了する。"""
    requested: list[str] = []

    async def get(host: str, path: str, params: Any = None, priority: str = "x") -> Any:
        requested.append(path)
        if is_timeline_path(path):
            raise status_error(429)
        return match_detail(match_id_of(path))

    with patch(GET, new=get):
        with pytest.raises(RiotRateLimitError) as exc_info:
            asyncio.run(fetch_match_details("JP", ["JP1_1", "JP1_2"]))

    error = exc_info.value
    assert [f.match.match_id for f in error.fetched] == ["JP1_1"]
    assert error.fetched[0].match.timeline_fetched_at is None
    assert requested == [
        "/lol/match/v5/matches/JP1_1",
        "/lol/match/v5/matches/JP1_1/timeline",
    ]


def test_raw_responses_are_saved_as_received() -> None:
    """詳細とタイムラインのレスポンスをそのまま生データとして保存する。"""
    _fetch(_ok_get())

    save_detail: AsyncMock = raw_store.save_detail  # type: ignore[assignment]
    save_timeline: AsyncMock = raw_store.save_timeline  # type: ignore[assignment]
    save_detail.assert_awaited_once_with("JP1_1", match_detail("JP1_1"))
    save_timeline.assert_awaited_once_with("JP1_1", TIMELINE)


def test_raw_store_failure_only_logs_and_continues(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    """生データの保存に失敗しても、処理を続けて結果を返す。"""
    for name in ("save_detail", "save_timeline"):
        monkeypatch.setattr(raw_store, name, AsyncMock(side_effect=RuntimeError("x")))

    result = _fetch(_ok_get())

    assert result.fetched[0].match.timeline_fetched_at is not None
    assert result.failures == []
    assert sum("生データの保管に失敗" in r.getMessage() for r in caplog.records) == 2


def test_timeline_only_reads_detail_from_raw_store(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """timeline_only_ids の試合は、保管済みの詳細を使い、詳細の Riot API を呼ばない。"""
    monkeypatch.setattr(
        raw_store, "load_detail", AsyncMock(return_value=match_detail("JP1_1"))
    )
    paths: list[str] = []

    async def get(host: str, path: str, params: Any = None, priority: str = "x") -> Any:
        paths.append(path)
        return TIMELINE

    result = _fetch(get, timeline_only_ids=frozenset({"JP1_1"}))

    assert paths == ["/lol/match/v5/matches/JP1_1/timeline"]
    assert result.fetched[0].participants[0].completed_items == [3157]
    raw_store.save_detail.assert_not_awaited()  # type: ignore[attr-defined]


def test_timeline_only_falls_back_to_riot_when_raw_is_missing() -> None:
    """保管済みの詳細がなければ、Riot API から詳細を取得する（既定の load_detail は None）。"""
    result = _fetch(_ok_get(), timeline_only_ids=frozenset({"JP1_1"}))

    assert result.fetched[0].match.timeline_fetched_at is not None
    raw_store.save_detail.assert_awaited_once()  # type: ignore[attr-defined]
