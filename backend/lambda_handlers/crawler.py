"""lollab-crawler の Lambda ハンドラー: EventBridge Scheduler が30分ごとに起動する。

同じクローラーが同時に複数動かないよう、DB のリース（riot-crawler）で1つに制限する。
取得できなければ何もせずに終了する（前回の起動が実行中）。
"""

import asyncio
import logging
from datetime import timedelta
from typing import Any

from adapters import riot_api, worker_lease_store
from services.crawler.run import run_crawl
from services.summoner import deadline

logger = logging.getLogger(__name__)

LEASE_NAME = "riot-crawler"
REGION = "JP"
# リースの期限は、締め切り（Lambda の終了時刻）にこの余裕を足す
_LEASE_EXTRA = timedelta(seconds=60)


async def _handle(context: Any) -> dict[str, Any]:
    remaining_ms = int(context.get_remaining_time_in_millis())
    holder = str(context.aws_request_id)
    ttl = timedelta(milliseconds=remaining_ms) + _LEASE_EXTRA
    if not await worker_lease_store.try_acquire(LEASE_NAME, holder, ttl):
        logger.info("前回のクローラーが実行中のため終了します")
        return {"status": "lease_unavailable"}
    try:
        result = await run_crawl(
            REGION, deadline.from_remaining_ms(remaining_ms), holder
        )
    finally:
        try:
            await worker_lease_store.release(LEASE_NAME, holder)
        except Exception:
            # 返せなくても期限で解放される
            logger.error("リースの返却に失敗しました", exc_info=True)
    return {"status": "done", "stop_reason": result.stop_reason}


async def _run(context: Any) -> dict[str, Any]:
    try:
        return await _handle(context)
    finally:
        # 呼び出しごとにイベントループが変わるため、接続を持ち越さない。
        # レート制限は、送信時刻のカウントを残したまま、ロックがループごとに作り直される
        await riot_api.close()


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """Lambda のエントリーポイント。"""
    return asyncio.run(_run(context))
