"""matches.py のユニットテスト。

試合取得失敗時のスキップ動作と timeAgoSeconds の計算ロジックを確認する。

_Requirements: 5.4, 5.6_
"""

import asyncio
import sys
from datetime import datetime, timezone
from types import ModuleType
from unittest.mock import AsyncMock, MagicMock, patch

# config と adapters.riot_api をモジュールレベルでモックして
# 環境変数なしでもインポートできるようにする
_mock_settings = MagicMock()
_mock_settings.riot_api_key = "test-key"

_mock_config = ModuleType("config")
_mock_config.settings = _mock_settings  # type: ignore[attr-defined]
sys.modules.setdefault("config", _mock_config)

_mock_riot_api = ModuleType("adapters.riot_api")
_mock_riot_api.get = AsyncMock()  # type: ignore[attr-defined]
sys.modules.setdefault("adapters.riot_api", _mock_riot_api)

_mock_adapters = sys.modules.get("adapters") or ModuleType("adapters")
sys.modules.setdefault("adapters", _mock_adapters)

from services.summoner.matches import get_matches  # noqa: E402

# ---------------------------------------------------------------------------
# ヘルパー
# ---------------------------------------------------------------------------


def _make_match_detail(puuid: str, game_end_timestamp_ms: int) -> dict:  # type: ignore[type-arg]
    """有効な試合詳細レスポンスを生成する。"""
    return {
        "metadata": {"matchId": "JP1_123"},
        "info": {
            "gameMode": "CLASSIC",
            "gameDuration": 1800,
            "gameEndTimestamp": game_end_timestamp_ms,
            "participants": [
                {
                    "puuid": puuid,
                    "championName": "Ahri",
                    "kills": 5,
                    "deaths": 2,
                    "assists": 8,
                    "totalMinionsKilled": 150,
                    "neutralMinionsKilled": 10,
                    "win": True,
                    "item0": 3157,
                    "item1": 3089,
                    "item2": 0,
                    "item3": 0,
                    "item4": 0,
                    "item5": 0,
                    "item6": 0,
                }
            ],
        },
    }


# ---------------------------------------------------------------------------
# テスト
# ---------------------------------------------------------------------------


def test_get_matches_skips_failed_match() -> None:
    """個別試合の取得が失敗した場合、その試合をスキップして残りを返す。

    _Requirements: 5.6_
    """
    account_data = {"puuid": "test-puuid", "gameName": "TestUser", "tagLine": "JP1"}
    match_ids = ["match1", "match2"]
    now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
    valid_match_detail = _make_match_detail("test-puuid", now_ms - 60_000)

    mock_get = AsyncMock(
        side_effect=[
            account_data,
            match_ids,
            Exception("fetch failed"),
            valid_match_detail,
        ]
    )

    with patch("services.summoner.matches.riot_api.get", mock_get):
        result = asyncio.run(get_matches("JP", "TestUser", "JP1", count=2))

    assert len(result) == 1
    assert result[0].matchId == "JP1_123"


def test_get_matches_time_ago_seconds() -> None:
    """timeAgoSeconds が現在時刻と gameEndTimestamp の差分として正しく計算される。

    _Requirements: 5.4_
    """
    fixed_now = datetime(2024, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    game_end_dt = datetime(2024, 1, 1, 11, 59, 0, tzinfo=timezone.utc)  # 60秒前
    game_end_timestamp_ms = int(game_end_dt.timestamp() * 1000)

    account_data = {"puuid": "test-puuid", "gameName": "TestUser", "tagLine": "JP1"}
    match_ids = ["match1"]
    match_detail = _make_match_detail("test-puuid", game_end_timestamp_ms)

    mock_get = AsyncMock(side_effect=[account_data, match_ids, match_detail])

    # datetime クラス全体をモックし、now() と fromtimestamp() の両方を制御する
    mock_datetime = MagicMock()
    mock_datetime.now.return_value = fixed_now
    mock_datetime.fromtimestamp.return_value = game_end_dt

    with (
        patch("services.summoner.matches.riot_api.get", mock_get),
        patch("services.summoner.matches.datetime", mock_datetime),
    ):
        result = asyncio.run(get_matches("JP", "TestUser", "JP1", count=1))

    assert len(result) == 1
    assert result[0].timeAgoSeconds == 60
