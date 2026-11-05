"""match_convert.convert_match のユニットテスト: 旧形式（パッチ11.20より前）の試合。"""

from datetime import datetime, timezone

from services.summoner.match_convert import convert_match
from tests.riot_fetch_helpers import GAME_END_MS, match_detail

START_MS = 1_600_000_000_000
DURATION_MS = 1_805_999


def test_convert_match_without_game_end_timestamp_uses_start_plus_duration() -> None:
    """gameEndTimestamp がなければ、終了日時は開始 + gameDuration(ms)、時間は秒に直す。"""
    detail = match_detail()
    del detail["info"]["gameEndTimestamp"]
    detail["info"]["gameStartTimestamp"] = START_MS
    detail["info"]["gameDuration"] = DURATION_MS

    result = convert_match(detail)

    expected_end = datetime.fromtimestamp(
        (START_MS + DURATION_MS) / 1000, tz=timezone.utc
    )
    assert result.match.game_end_at == expected_end
    assert result.match.game_duration == 1805
    assert all(p.game_end_at == expected_end for p in result.participants)


def test_convert_match_with_game_end_timestamp_keeps_duration_in_seconds() -> None:
    """gameEndTimestamp があれば、終了日時はそれを使い、gameDuration は秒のまま。"""
    detail = match_detail()
    detail["info"]["gameStartTimestamp"] = START_MS

    result = convert_match(detail)

    assert result.match.game_end_at == datetime.fromtimestamp(
        GAME_END_MS / 1000, tz=timezone.utc
    )
    assert result.match.game_duration == 1800
