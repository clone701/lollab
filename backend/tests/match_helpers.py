"""試合詳細 API のテスト用ヘルパー（生データの生成・ストアのスタブ）。"""

import sys
from types import ModuleType
from typing import Any
from unittest.mock import AsyncMock

from tests.riot_fetch_helpers import match_detail

# 参加者（index 0〜4 がチーム100、5〜9 がチーム200）のポジション。並びをわざと崩している
POSITIONS = [
    "BOTTOM",
    "",
    "TOP",
    "UTILITY",
    "JUNGLE",
    "UTILITY",
    "MIDDLE",
    "BOTTOM",
    "JUNGLE",
    "TOP",
]

_STUBS: dict[str, tuple[str, ...]] = {
    "adapters.match_store": ("get_raw_bundle_key",),
    "adapters.match_rank_store": ("get_ranks",),
}


def install_match_stubs() -> None:
    """試合詳細のストアを（未登録なら）スタブとして登録する。

    本物は import 時に Supabase クライアントを作るため、環境変数なしでは読み込めない。
    """
    for module_name, functions in _STUBS.items():
        module = sys.modules.get(module_name)
        if module is None:
            module = ModuleType(module_name)
            sys.modules[module_name] = module
        for name in functions:
            if not hasattr(module, name):
                setattr(module, name, AsyncMock())


def raw_detail(match_id: str = "JP1_1") -> dict[str, Any]:
    """試合詳細 API が使う項目をすべて持つ、10人分の試合詳細の生データ。"""
    detail = match_detail(match_id)
    info = detail["info"]
    for index, p in enumerate(info["participants"]):
        p.update(
            champLevel=15 + index,
            totalDamageTaken=10_000 + index,
            wardsPlaced=index,
            wardsKilled=index + 1,
            visionWardsBoughtInGame=index + 2,
            teamPosition=POSITIONS[index],
        )
    info["teams"] = [
        {
            "teamId": 200,
            "win": False,
            "bans": [],
            "objectives": {"baron": {"first": True, "kills": 1}},
        },
        {
            "teamId": 100,
            "win": True,
            "bans": [],
            "objectives": {
                "baron": {"first": False, "kills": 0},
                "dragon": {"first": True, "kills": 3},
                "riftHerald": {"first": True, "kills": 1},
                "horde": {"first": False, "kills": 6},
                "tower": {"first": True, "kills": 9},
                "inhibitor": {"first": True, "kills": 2},
            },
        },
    ]
    return detail


def event(kind: str, participant_id: int, timestamp: int, **fields: Any) -> dict:
    """タイムラインのイベントを1つ作る。"""
    return {
        "type": kind,
        "participantId": participant_id,
        "timestamp": timestamp,
        **fields,
    }


def timeline_of(events: list[dict[str, Any]]) -> dict[str, Any]:
    """イベントを2つのフレームに分けたタイムラインを作る（フレームをまたいでも扱えることの確認）。"""
    half = len(events) // 2
    return {"info": {"frames": [{"events": events[:half]}, {"events": events[half:]}]}}
