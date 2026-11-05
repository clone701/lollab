"""全テスト共通のフィクスチャ。

試合の取得は生データの保管（Supabase Storage）と Data Dragon（外部 HTTP）を呼ぶ。
テストが実際のストレージ・ネットワークに接続しないよう、既定で代役に差し替える。
個別のテストは monkeypatch で上書きできる。
"""

from collections.abc import Iterator
from typing import Any
from unittest.mock import AsyncMock

import pytest

from adapters import ddragon, raw_store
from services.summoner import item_catalog

# 既定の item.json: tests/riot_fetch_helpers.py の試合詳細で使うアイテムは完成品
DEFAULT_ITEMS: dict[str, dict[str, Any]] = {
    str(item_id): {"from": [1001], "into": [], "tags": [], "depth": 3}
    for item_id in (3157, 3089, 3135, 3020, 3165, 3040, 3363)
}


@pytest.fixture(autouse=True)
def fake_external_data(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    for name in ("save_detail", "save_timeline"):
        monkeypatch.setattr(raw_store, name, AsyncMock(return_value=None))
    for name in ("load_detail", "load_timeline"):
        monkeypatch.setattr(raw_store, name, AsyncMock(return_value=None))
    monkeypatch.setattr(ddragon, "fetch_versions", AsyncMock(return_value=["15.10.1"]))
    monkeypatch.setattr(ddragon, "fetch_items", AsyncMock(return_value=DEFAULT_ITEMS))
    item_catalog.clear_cache()
    yield
    item_catalog.clear_cache()
