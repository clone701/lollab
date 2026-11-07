"""stats_period.py のユニットテスト: チャンピオン統計の集計範囲の決め方。"""

import asyncio
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

from tests.sync_helpers import install_store_stub

install_store_stub()

from schemas.summoner_store import SeasonRecord  # noqa: E402
from services.summoner.stats_period import (  # noqa: E402
    resolve_stats_start,
    resolve_stats_year,
)

_EARLIEST = "services.summoner.stats_period.season_store.get_earliest_start_at"

_JAN = datetime(2026, 1, 8, tzinfo=timezone.utc)
_SEP = datetime(2026, 9, 1, tzinfo=timezone.utc)


def _season(season_id: str, start_at: datetime = _SEP) -> SeasonRecord:
    return SeasonRecord(id=season_id, name=season_id, start_at=start_at, end_at=None)


def _resolve(
    season: SeasonRecord | None, earliest: datetime | None = None
) -> tuple:  # type: ignore[type-arg]
    """(開始日時, 問い合わせのモック) を返す。"""
    mock = AsyncMock(return_value=earliest)
    with patch(_EARLIEST, new=mock):
        return asyncio.run(resolve_stats_start(season)), mock


def test_starts_from_first_season_of_the_year() -> None:
    """2026-S3 なら、2026- で始まるシーズンの最も早い start_at から数える。"""
    start, mock = _resolve(_season("2026-S3"), earliest=_JAN)

    assert start == _JAN
    mock.assert_awaited_once_with("2026-")


def test_current_season_is_first_of_the_year() -> None:
    """その年の最初のシーズンが現行なら、そのシーズンの start_at になる。"""
    start, _ = _resolve(_season("2026-S1", _JAN), earliest=_JAN)

    assert start == _JAN


def test_all_time_without_current_season() -> None:
    """現行シーズンがなければ全期間（None）で、DB も引かない。"""
    start, mock = _resolve(None)

    assert start is None
    mock.assert_not_awaited()


def test_season_start_when_id_has_no_year() -> None:
    """年が取れない id は、そのシーズンの start_at を使い、DB も引かない。"""
    for season_id in ("S3", "preseason", "26-S1", "2026S3", ""):
        start, mock = _resolve(_season(season_id), earliest=_JAN)

        assert start == _SEP, season_id
        mock.assert_not_awaited()


def test_season_start_when_year_has_no_rows() -> None:
    """同じ年のシーズンが見つからなければ、現行シーズンの start_at にする。"""
    start, _ = _resolve(_season("2026-S3"), earliest=None)

    assert start == _SEP


def test_year_is_first_four_digits_of_season_id() -> None:
    """2026-S3 なら 2026。"""
    assert resolve_stats_year(_season("2026-S3")) == 2026
    assert resolve_stats_year(_season("2025-S1")) == 2025


def test_year_is_none_without_current_season() -> None:
    """現行シーズンがなければ None。"""
    assert resolve_stats_year(None) is None


def test_year_is_none_when_id_has_no_year() -> None:
    """年が取れない id は None。"""
    for season_id in ("S3", "preseason", "26-S1", "2026S3", ""):
        assert resolve_stats_year(_season(season_id)) is None, season_id
