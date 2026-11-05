"""Data Dragon のアイテム情報から、完成アイテムを判定する。

パッチ単位でメモリにキャッシュする（取得に失敗した場合はキャッシュしない）。
"""

import asyncio
import logging
from typing import Any

from adapters import ddragon

logger = logging.getLogger(__name__)

# パッチ（例: "16.22"）→ 完成アイテムの itemId
_cache: dict[str, frozenset[int]] = {}
# 取得中のパッチ → タスク（同じパッチの同時取得を1回にまとめる）
_inflight: dict[str, "asyncio.Future[frozenset[int]]"] = {}


def select_version(patch: str, versions: list[str]) -> str | None:
    """versions（新しい順）から、パッチ（"16.22"）に一致する最新の版を返す。なければ None。"""
    prefix = f"{patch}."
    return next((v for v in versions if v.startswith(prefix)), None)


def is_completed_item(item: dict[str, Any]) -> bool:
    """item.json の1件が完成アイテムか。

    - into が空、from が空でない、Consumable・Trinket タグなし、inStore が false でない
    - または、Boots タグかつ depth = 2 の靴（into はあるが完成品として扱う）
    """
    tags = item.get("tags", [])
    if "Boots" in tags and item.get("depth") == 2:
        return True
    return (
        not item.get("into")
        and bool(item.get("from"))
        and "Consumable" not in tags
        and "Trinket" not in tags
        and item.get("inStore", True) is not False
    )


async def _load(patch: str) -> frozenset[int]:
    versions = await ddragon.fetch_versions()
    version = select_version(patch, versions)
    if version is None:
        version = versions[0]
        logger.warning(
            "パッチ %s に一致する Data Dragon の版がないため最新版 %s を使います",
            patch,
            version,
        )
    items = await ddragon.fetch_items(version)
    return frozenset(int(i) for i, item in items.items() if is_completed_item(item))


async def get_completed_items(patch: str) -> frozenset[int]:
    """パッチに対応する版の、完成アイテムの itemId を返す。

    Raises:
        Exception: Data Dragon の取得に失敗した場合（呼び出し元で扱う）
    """
    cached = _cache.get(patch)
    if cached is not None:
        return cached
    task = _inflight.get(patch)
    if task is None:
        task = asyncio.ensure_future(_load(patch))
        _inflight[patch] = task
        task.add_done_callback(lambda _: _inflight.pop(patch, None))
    result = await asyncio.shield(task)
    _cache[patch] = result
    return result


def clear_cache() -> None:
    """キャッシュを空にする（テスト用）。"""
    _cache.clear()
    _inflight.clear()
