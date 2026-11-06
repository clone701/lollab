"""services/match/raw_source.py のテスト: 読み出しの順序と Riot API の扱い。

順序: 1試合1ファイル → まとめファイル（見つかれば1試合1ファイルに保存）→ Riot API。

_Requirements: 4.1〜4.3
"""

import asyncio
from collections.abc import Iterator
from typing import Any, cast
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from adapters import raw_bundle_store, raw_store
from services.match import raw_source
from services.summoner.riot_errors import RiotRateLimitError
from tests.riot_fetch_helpers import status_error

DETAIL = {"kind": "detail"}
TIMELINE = {"kind": "timeline"}
KEY = "bundles/crawler/2026-11-06/run-1.jsonl.gz"


class Riot:
    """get_riot の代役。パスごとに応答（または例外）を返し、呼び出しを記録する。"""

    def __init__(self, detail: Any = DETAIL, timeline: Any = TIMELINE) -> None:
        self.responses = {"detail": detail, "timeline": timeline}
        self.calls: list[tuple[str, str, str]] = []

    async def __call__(
        self, host: str, path: str, params: Any = None, priority: str = "interactive"
    ) -> Any:
        self.calls.append((host, path, priority))
        response = self.responses[
            "timeline" if path.endswith("/timeline") else "detail"
        ]
        if isinstance(response, Exception):
            raise response
        return response


@pytest.fixture
def riot(monkeypatch: pytest.MonkeyPatch) -> Riot:
    fake = Riot()
    monkeypatch.setattr(raw_source, "get_riot", fake)
    return fake


@pytest.fixture
def bundle(monkeypatch: pytest.MonkeyPatch) -> AsyncMock:
    mock = AsyncMock(return_value=(None, None))
    monkeypatch.setattr(raw_bundle_store, "find_in_bundle", mock)
    return mock


@pytest.fixture
def stored(monkeypatch: pytest.MonkeyPatch) -> Iterator[dict[str, Any]]:
    """1試合1ファイルの保管先。値を入れると load_* がそれを返す。"""
    files: dict[str, Any] = {"detail": None, "timeline": None}
    monkeypatch.setattr(
        raw_store, "load_detail", AsyncMock(side_effect=lambda m: files["detail"])
    )
    monkeypatch.setattr(
        raw_store, "load_timeline", AsyncMock(side_effect=lambda m: files["timeline"])
    )
    yield files


def saved(name: str) -> AsyncMock:
    """conftest が差し替えた、生データの保存関数のモック。"""
    return cast(AsyncMock, getattr(raw_store, name))


def _load(match_id: str = "JP1_1", key: str | None = KEY) -> Any:
    return asyncio.run(raw_source.load_raw(match_id, key))


def test_per_match_files_are_used_without_other_sources(
    stored: dict[str, Any], riot: Riot, bundle: AsyncMock
) -> None:
    stored.update(detail=DETAIL, timeline=TIMELINE)

    assert _load() == (DETAIL, TIMELINE)

    bundle.assert_not_awaited()
    assert riot.calls == []
    saved("save_detail").assert_not_awaited()


def test_bundle_is_searched_and_found_data_is_saved_per_match(
    stored: dict[str, Any], riot: Riot, bundle: AsyncMock
) -> None:
    bundle.return_value = (DETAIL, TIMELINE)

    assert _load() == (DETAIL, TIMELINE)

    bundle.assert_awaited_once_with(KEY, "JP1_1")
    saved("save_detail").assert_awaited_once_with("JP1_1", DETAIL)
    saved("save_timeline").assert_awaited_once_with("JP1_1", TIMELINE)
    assert riot.calls == []


def test_bundle_without_timeline_fetches_only_the_timeline(
    stored: dict[str, Any], riot: Riot, bundle: AsyncMock
) -> None:
    bundle.return_value = (DETAIL, None)

    assert _load() == (DETAIL, TIMELINE)

    assert [path for _, path, _ in riot.calls] == [
        "/lol/match/v5/matches/JP1_1/timeline"
    ]
    saved("save_detail").assert_awaited_once_with("JP1_1", DETAIL)
    saved("save_timeline").assert_awaited_once_with("JP1_1", TIMELINE)


def test_no_bundle_key_skips_bundle_and_calls_riot_for_both(
    stored: dict[str, Any], riot: Riot, bundle: AsyncMock
) -> None:
    assert _load(key=None) == (DETAIL, TIMELINE)

    bundle.assert_not_awaited()
    assert riot.calls == [
        ("asia", "/lol/match/v5/matches/JP1_1", "interactive"),
        ("asia", "/lol/match/v5/matches/JP1_1/timeline", "interactive"),
    ]
    saved("save_detail").assert_awaited_once_with("JP1_1", DETAIL)
    saved("save_timeline").assert_awaited_once_with("JP1_1", TIMELINE)


def test_bundle_miss_falls_back_to_riot(
    stored: dict[str, Any], riot: Riot, bundle: AsyncMock
) -> None:
    assert _load() == (DETAIL, TIMELINE)

    bundle.assert_awaited_once()
    assert len(riot.calls) == 2


def test_missing_timeline_only_is_refetched_from_riot(
    stored: dict[str, Any], riot: Riot, bundle: AsyncMock
) -> None:
    stored.update(detail=DETAIL)

    assert _load() == (DETAIL, TIMELINE)

    bundle.assert_not_awaited()
    assert [path for _, path, _ in riot.calls] == [
        "/lol/match/v5/matches/JP1_1/timeline"
    ]
    saved("save_detail").assert_not_awaited()
    saved("save_timeline").assert_awaited_once_with("JP1_1", TIMELINE)


@pytest.mark.parametrize(
    "error",
    [status_error(404), status_error(500), RiotRateLimitError(status_error(429))],
)
def test_timeline_failure_returns_none_without_saving(
    stored: dict[str, Any], riot: Riot, bundle: AsyncMock, error: Exception
) -> None:
    stored.update(detail=DETAIL)
    riot.responses["timeline"] = error

    assert _load() == (DETAIL, None)

    saved("save_timeline").assert_not_awaited()


def test_detail_rate_limit_is_429(
    stored: dict[str, Any], riot: Riot, bundle: AsyncMock
) -> None:
    riot.responses["detail"] = RiotRateLimitError(status_error(429))

    with pytest.raises(HTTPException) as exc_info:
        _load()

    assert exc_info.value.status_code == 429
    assert len(riot.calls) == 1
    saved("save_detail").assert_not_awaited()


@pytest.mark.parametrize("error", [status_error(404), status_error(500), OSError("x")])
def test_detail_failure_is_502_without_leaking_details(
    stored: dict[str, Any], riot: Riot, bundle: AsyncMock, error: Exception
) -> None:
    riot.responses["detail"] = error

    with pytest.raises(HTTPException) as exc_info:
        _load()

    assert exc_info.value.status_code == 502
    assert exc_info.value.detail == "試合詳細を取得できませんでした"


def test_save_failure_is_logged_and_data_is_still_returned(
    stored: dict[str, Any],
    riot: Riot,
    bundle: AsyncMock,
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
) -> None:
    monkeypatch.setattr(raw_store, "save_detail", AsyncMock(side_effect=OSError))
    monkeypatch.setattr(raw_store, "save_timeline", AsyncMock(side_effect=OSError))

    assert _load(key=None) == (DETAIL, TIMELINE)

    assert sum("生データの保存に失敗" in r.getMessage() for r in caplog.records) == 2


def test_unknown_region_prefix_is_404_without_calling_riot(
    stored: dict[str, Any], riot: Riot, bundle: AsyncMock
) -> None:
    with pytest.raises(HTTPException) as exc_info:
        _load("XX9_1", key=None)

    assert exc_info.value.status_code == 404
    assert riot.calls == []


def test_regional_host_follows_match_id_prefix(
    stored: dict[str, Any], riot: Riot, bundle: AsyncMock
) -> None:
    _load("NA1_5", key=None)

    assert {host for host, _, _ in riot.calls} == {"americas"}
