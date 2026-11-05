"""item_catalog のユニットテスト: 完成アイテム判定・版の選択・キャッシュ。

_Requirements: 4.6, 4.8_
"""

import asyncio
from typing import Any
from unittest.mock import AsyncMock

import pytest

from adapters import ddragon
from services.summoner import item_catalog
from services.summoner.item_catalog import is_completed_item, select_version


def _item(**fields: Any) -> dict[str, Any]:
    return fields


@pytest.mark.parametrize(
    ("item", "expected"),
    [
        # 完成品: into が空で from がある
        (_item(into=[], **{"from": [1, 2]}, tags=["Damage"]), True),
        (_item(**{"from": [1]}, tags=[]), True),
        # 2段階目の靴は into があっても完成品として扱う
        (_item(into=[3020], **{"from": [1001]}, tags=["Boots"], depth=2), True),
        # 1段階目の靴は完成品ではない
        (_item(into=[3006], tags=["Boots"], depth=1), False),
        # 消耗品・トリンケット
        (_item(into=[], **{"from": [1]}, tags=["Consumable"]), False),
        (_item(into=[], **{"from": [1]}, tags=["Trinket"]), False),
        # 素材（into がある）・from がない基本アイテム
        (_item(into=[3157], **{"from": [1]}, tags=[]), False),
        (_item(into=[], tags=[]), False),
        # 店で買えないアイテム
        (_item(into=[], **{"from": [1]}, tags=[], inStore=False), False),
    ],
)
def test_is_completed_item(item: dict[str, Any], expected: bool) -> None:
    assert is_completed_item(item) is expected


def test_select_version_picks_latest_matching_patch() -> None:
    """パッチ（16.22）で始まる版のうち、先頭（最新）を選ぶ。16.2 とは混同しない。"""
    versions = ["16.23.1", "16.22.2", "16.22.1", "16.2.1", "16.1.1"]

    assert select_version("16.22", versions) == "16.22.2"
    assert select_version("16.2", versions) == "16.2.1"
    assert select_version("15.1", versions) is None


def _use_items(monkeypatch: pytest.MonkeyPatch, versions: list[str]) -> AsyncMock:
    items = {
        "3157": {"from": [1], "into": [], "tags": []},
        "1001": {"into": [3157], "tags": []},
    }
    fetch_items = AsyncMock(return_value=items)
    monkeypatch.setattr(ddragon, "fetch_versions", AsyncMock(return_value=versions))
    monkeypatch.setattr(ddragon, "fetch_items", fetch_items)
    return fetch_items


def test_get_completed_items_uses_matching_version_and_caches(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """パッチに対応する版を取得し、同じパッチはキャッシュから返す（同時呼び出しも1回）。"""
    fetch_items = _use_items(monkeypatch, ["16.23.1", "16.22.2", "16.22.1"])

    async def _run() -> list[frozenset[int]]:
        first = await asyncio.gather(
            *(item_catalog.get_completed_items("16.22") for _ in range(5))
        )
        return [*first, await item_catalog.get_completed_items("16.22")]

    results = asyncio.run(_run())

    assert all(r == frozenset({3157}) for r in results)
    fetch_items.assert_awaited_once_with("16.22.2")


def test_get_completed_items_falls_back_to_latest_with_log(
    monkeypatch: pytest.MonkeyPatch, caplog: pytest.LogCaptureFixture
) -> None:
    """一致する版がなければ最新版を使い、ログを出す。"""
    fetch_items = _use_items(monkeypatch, ["16.23.1", "16.22.2"])

    result = asyncio.run(item_catalog.get_completed_items("14.1"))

    assert result == frozenset({3157})
    fetch_items.assert_awaited_once_with("16.23.1")
    assert any("14.1" in r.getMessage() for r in caplog.records)


def test_get_completed_items_does_not_cache_failures(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """取得に失敗した場合は例外を伝え、次回は取り直す。"""
    fetch_items = _use_items(monkeypatch, ["16.22.1"])
    fetch_items.side_effect = [RuntimeError("down"), {"3157": {"from": [1]}}]

    with pytest.raises(RuntimeError):
        asyncio.run(item_catalog.get_completed_items("16.22"))
    result = asyncio.run(item_catalog.get_completed_items("16.22"))

    assert result == frozenset({3157})
