"""lollab-backfill の Lambda ハンドラー: lollab-api から非同期で起動される。

イベント: {"region": "JP", "puuid": "..."}
Riot API を使う Backfill の同時実行は、DB のリース（riot-backfill）で1つに制限する。
取得できなければ何もせずに終了する（次回の検索・更新で続きから行われる）。
"""

import asyncio
import logging
from datetime import timedelta
from typing import Any

from adapters import riot_api, worker_lease_store
from services.summoner import deadline
from services.summoner.backfill import run_backfill

logger = logging.getLogger(__name__)

LEASE_NAME = "riot-backfill"
# リースの期限は、締め切り（Lambda の終了時刻）にこの余裕を足す
_LEASE_EXTRA = timedelta(seconds=60)


async def _handle(event: dict[str, Any], context: Any) -> dict[str, Any]:
    region = event.get("region")
    puuid = event.get("puuid")
    if not isinstance(region, str) or not isinstance(puuid, str):
        logger.error("イベントに region と puuid が必要です")
        return {"status": "invalid_event"}

    remaining_ms = int(context.get_remaining_time_in_millis())
    holder = str(context.aws_request_id)
    ttl = timedelta(milliseconds=remaining_ms) + _LEASE_EXTRA
    if not await worker_lease_store.try_acquire(LEASE_NAME, holder, ttl):
        logger.info("他の Backfill が実行中のため終了します")
        return {"status": "lease_unavailable"}
    try:
        await run_backfill(region, puuid, deadline.from_remaining_ms(remaining_ms))
    finally:
        try:
            await worker_lease_store.release(LEASE_NAME, holder)
        except Exception:
            # 返せなくても期限で解放される
            logger.error("リースの返却に失敗しました", exc_info=True)
    return {"status": "done"}


async def _run(event: dict[str, Any], context: Any) -> dict[str, Any]:
    try:
        return await _handle(event, context)
    finally:
        # 呼び出しごとにイベントループが変わるため、接続を持ち越さない
        await riot_api.close()


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """Lambda のエントリーポイント。"""
    return asyncio.run(_run(event, context))
