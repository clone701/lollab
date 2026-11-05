"""チャンピオンビルドのテスト用ヘルパー（ストアのスタブ・Supabase クライアントの代役）。"""

import sys
from types import ModuleType, SimpleNamespace
from typing import Any
from unittest.mock import AsyncMock

import pytest

from schemas.champion_store import BuildRow, StatsFilter
from tests.store_helpers import FakeClient, FakeQuery

STORE_FUNCTIONS = (
    "get_latest_patch",
    "get_champion_id",
    "get_build_rows",
    "count_role_games",
    "get_role_win_totals",
    "count_matches",
    "count_bans",
)


def install_champion_store_stub() -> ModuleType:
    """adapters.champion_stats_store を（未登録なら）スタブとして登録する。

    本物は import 時に Supabase クライアントを作るため、環境変数なしでは読み込めない。
    """
    name = "adapters.champion_stats_store"
    module = sys.modules.get(name)
    if module is None:
        module = ModuleType(name)
        sys.modules[name] = module
    for function in STORE_FUNCTIONS:
        if not hasattr(module, function):
            setattr(module, function, AsyncMock())
    return module


class CountQuery(FakeQuery):
    """count 付きクエリの代役。execute が行数（count）も返す。"""

    def __init__(self, data: list[dict[str, Any]], count: int | None) -> None:
        super().__init__(data)
        self.count = count

    def execute(self) -> SimpleNamespace:
        return SimpleNamespace(data=self.data, count=self.count)

    def args_of(self, name: str) -> list[tuple[Any, ...]]:
        """指定メソッドの全呼び出しの引数。"""
        return [args for called, args, _ in self.calls if called == name]


class CountClient(FakeClient):
    """table() ごとに、用意した応答を順に返す。list は行データ、int は count。"""

    def __init__(self, *responses: list[dict[str, Any]] | int) -> None:
        super().__init__()
        self._queue: list[list[dict[str, Any]] | int] = list(responses)
        self.tables: list[tuple[str, CountQuery]] = []

    def table(self, name: str) -> CountQuery:
        response = self._queue.pop(0) if self._queue else []
        if isinstance(response, int):
            query = CountQuery([], response)
        else:
            query = CountQuery(response, None)
        self.tables.append((name, query))
        return query


class Store:
    """試合が存在する状態を既定値とする、ストア関数の AsyncMock の集まり。"""

    def __init__(self, monkeypatch: pytest.MonkeyPatch) -> None:
        defaults: dict[str, Any] = {
            "get_latest_patch": "16.22",
            "get_champion_id": 64,
            "get_build_rows": [build_row()],
            "count_role_games": {"MIDDLE": 1},
            "get_role_win_totals": (10, 5),
            "count_matches": 20,
            "count_bans": 0,
        }
        assert set(defaults) == set(STORE_FUNCTIONS)
        module = install_champion_store_stub()
        self.mocks: dict[str, AsyncMock] = {}
        for name, value in defaults.items():
            self.mocks[name] = AsyncMock(return_value=value)
            monkeypatch.setattr(module, name, self.mocks[name])

    def __getitem__(self, name: str) -> AsyncMock:
        return self.mocks[name]

    def args(self, name: str) -> tuple[Any, ...]:
        """指定したストア関数に最後に渡された位置引数。"""
        call = self.mocks[name].await_args
        assert call is not None
        return tuple(call.args)

    def filters(self, name: str) -> StatsFilter:
        """指定したストア関数に最後に渡された StatsFilter。"""
        found = [a for a in self.args(name) if isinstance(a, StatsFilter)]
        assert len(found) == 1
        return found[0]


def build_row(**overrides: Any) -> BuildRow:
    fields: dict[str, Any] = {
        "win": True,
        "spell1_id": 4,
        "spell2_id": 14,
        "primary_style_id": 8100,
        "sub_style_id": 8200,
        "primary_perk_ids": [8112, 8126, 8138, 8135],
        "sub_perk_ids": [8236, 8234],
        "stat_perk_ids": [5008, 5008, 5002],
        "skill_order": [1, 2, 3] + [1] * 12,
        "starting_items": [1055, 2003],
        "completed_items": [3157, 3089, 3135, 3020, 3165, 3040],
    }
    fields.update(overrides)
    return BuildRow.model_validate(fields)
