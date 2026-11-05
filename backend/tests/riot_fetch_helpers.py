"""riot_fetch のテスト用ヘルパー（Riot API レスポンスの生成）。"""

from typing import Any
from unittest.mock import MagicMock

import httpx

GET = "services.summoner.riot_fetch.riot_api.get"
GAME_END_MS = 1_700_000_000_123

# ---------------------------------------------------------------------------
# ヘルパー
# ---------------------------------------------------------------------------


def status_error(status_code: int) -> httpx.HTTPStatusError:
    """指定ステータスコードの httpx.HTTPStatusError を生成する。"""
    response = MagicMock()
    response.status_code = status_code
    return httpx.HTTPStatusError("error", request=MagicMock(), response=response)


def participant(index: int) -> dict[str, Any]:
    """参加者1人分のレスポンスを生成する（index 1 は teamPosition なし）。"""
    return {
        "puuid": f"puuid-{index}",
        "participantId": index + 1,
        "gameEndedInEarlySurrender": False,
        "riotIdGameName": f"Name{index}",
        "riotIdTagline": f"T{index}",
        "teamId": 100 if index < 5 else 200,
        "teamPosition": "" if index == 1 else "MIDDLE",
        "championId": 103 + index,
        "championName": f"Champ{index}",
        "win": index < 5,
        "kills": 5,
        "deaths": 2,
        "assists": 8,
        "totalMinionsKilled": 150,
        "neutralMinionsKilled": 10,
        "goldEarned": 12345,
        "totalDamageDealtToChampions": 23456,
        "visionScore": 31,
        "item0": 3157,
        "item1": 3089,
        "item2": 3135,
        "item3": 3020,
        "item4": 3165,
        "item5": 3040,
        "item6": 3363,
        "summoner1Id": 4,
        "summoner2Id": 14,
        "perks": {
            "statPerks": {"offense": 5005, "flex": 5008, "defense": 5002},
            "styles": [
                {
                    "style": 8100,
                    "selections": [
                        {"perk": 8112},
                        {"perk": 8126},
                        {"perk": 8139},
                        {"perk": 8135},
                    ],
                },
                {
                    "style": 8200,
                    "selections": [{"perk": 8226}, {"perk": 8210}],
                },
            ],
        },
    }


def match_detail(match_id: str = "JP1_1") -> dict[str, Any]:
    """10人分の参加者を含む試合詳細レスポンスを生成する。"""
    return {
        "metadata": {"matchId": match_id},
        "info": {
            "queueId": 420,
            "gameMode": "CLASSIC",
            "gameVersion": "15.10.678.1234",
            "gameDuration": 1800,
            "gameEndTimestamp": GAME_END_MS,
            "participants": [participant(i) for i in range(10)],
            "teams": [
                {
                    "teamId": 100,
                    "bans": [
                        {"championId": 11, "pickTurn": 1},
                        {"championId": -1, "pickTurn": 2},
                    ],
                },
                {"teamId": 200, "bans": [{"championId": 22, "pickTurn": 6}]},
            ],
        },
    }


def timeline_detail() -> dict[str, Any]:
    """スキル習得と購入のイベントを少数含むタイムラインのレスポンスを生成する。"""
    events = [
        {
            "type": "ITEM_PURCHASED",
            "participantId": 1,
            "itemId": 1055,
            "timestamp": 5000,
        },
        {
            "type": "SKILL_LEVEL_UP",
            "participantId": 1,
            "skillSlot": 1,
            "levelUpType": "NORMAL",
            "timestamp": 10000,
        },
        {
            "type": "ITEM_PURCHASED",
            "participantId": 1,
            "itemId": 3157,
            "timestamp": 600000,
        },
    ]
    return {"info": {"frames": [{"events": events}]}}


def match_id_of(path: str) -> str:
    """試合詳細・タイムライン（.../{matchId}/timeline）のパスから試合IDを取り出す。"""
    return path.removesuffix("/timeline").rsplit("/", 1)[-1]


def is_timeline_path(path: str) -> bool:
    return path.endswith("/timeline")
