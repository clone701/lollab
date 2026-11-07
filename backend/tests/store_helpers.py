"""summoner_store のテスト用ヘルパー（Supabase クライアントの代役など）。"""

import importlib.util
import sys
from datetime import datetime, timezone
from pathlib import Path
from types import ModuleType, SimpleNamespace
from typing import Any
from unittest.mock import patch

import pytest

from schemas.summoner_store import ParticipantRecord

NOW = datetime(2025, 3, 1, 12, 0, tzinfo=timezone.utc)


class FakeQuery:
    """メソッド呼び出しを記録し、自分自身を返すクエリビルダーの代役。"""

    def __init__(self, data: list[dict[str, Any]]) -> None:
        self.data = data
        self.calls: list[tuple[str, tuple[Any, ...], dict[str, Any]]] = []

    def __getattr__(self, name: str) -> Any:
        def _record(*args: Any, **kwargs: Any) -> "FakeQuery":
            self.calls.append((name, args, kwargs))
            return self

        return _record

    def execute(self) -> SimpleNamespace:
        return SimpleNamespace(data=self.data)

    def call(self, name: str) -> tuple[tuple[Any, ...], dict[str, Any]]:
        """指定メソッドの最初の呼び出しの (args, kwargs) を返す。"""
        for called, args, kwargs in self.calls:
            if called == name:
                return args, kwargs
        raise AssertionError(f"{name} は呼ばれていません: {self.calls}")

    def names(self) -> list[str]:
        return [name for name, _, _ in self.calls]


class FakeClient:
    """table() ごとに、用意したレスポンスを順に返すクライアントの代役。"""

    def __init__(self, *responses: list[dict[str, Any]]) -> None:
        self._responses = list(responses)
        self.queries: list[tuple[str, FakeQuery]] = []

    def table(self, name: str) -> FakeQuery:
        data = self._responses.pop(0) if self._responses else []
        query = FakeQuery(data)
        self.queries.append((name, query))
        return query


def load_store(filename: str = "summoner_store.py") -> ModuleType:
    """Supabase に接続せずに adapters/ のストアモジュールを読み込む。"""
    fake_supabase = ModuleType("adapters.supabase")
    fake_supabase.supabase = FakeClient()  # type: ignore[attr-defined]
    path = Path(__file__).resolve().parent.parent / "adapters" / filename
    spec = importlib.util.spec_from_file_location(f"{path.stem}_under_test", path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    with patch.dict(sys.modules, {"adapters.supabase": fake_supabase}):
        spec.loader.exec_module(module)
    return module


store = load_store()
# 他のテストが sys.modules["adapters"] を差し替える前（最初の import 時）に読み込む
season_store = load_store("season_store.py")


def use(monkeypatch: pytest.MonkeyPatch, client: FakeClient) -> None:
    monkeypatch.setattr(store, "supabase", client)


def summoner_row(**overrides: Any) -> dict[str, Any]:
    row: dict[str, Any] = {
        "puuid": "puuid-0",
        "region": "JP",
        "game_name": "TestUser",
        "tag_line": "JP1",
        "riot_id_lower": "testuser#jp1",
        "level": 100,
        "profile_icon_id": 7,
        "solo_tier": "GOLD",
        "solo_rank": "II",
        "solo_lp": 50,
        "solo_wins": 10,
        "solo_losses": 5,
        "flex_wins": 4,
        "flex_losses": 3,
        "rank_position": None,
        "rank_total": None,
        "rank_top_percent": 45.5,
        "last_updated_at": "2025-03-01T12:00:00+00:00",
        "synced_until": None,
        "backfill_cursor": None,
        "backfill_completed": False,
        "backfill_started_at": None,
        "created_at": "2025-01-01T00:00:00+00:00",
    }
    row.update(overrides)
    return row


def participant(match_id: str = "JP1_1", puuid: str = "puuid-0") -> ParticipantRecord:
    return ParticipantRecord(
        match_id=match_id,
        puuid=puuid,
        team_id=100,
        team_position="",
        champion_id=103,
        champion_name="Ahri",
        win=True,
        kills=1,
        deaths=2,
        assists=3,
        cs=100,
        gold_earned=10000,
        damage_to_champions=20000,
        vision_score=20,
        item_ids=[1, 2, 3, 4, 5, 6, 7],
        spell1_id=4,
        spell2_id=14,
        keystone_id=8112,
        primary_style_id=8100,
        sub_style_id=8200,
        queue_id=420,
        game_end_at=NOW,
    )


def participation_row(index: int) -> dict[str, Any]:
    row = participant(f"JP1_{index}").model_dump(mode="json")
    row["matches"] = {"game_mode": "CLASSIC", "game_duration": 1800}
    return row
