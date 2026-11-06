"""Backfill の起動方法の切り替え。

BACKFILL_MODE=lambda: 別の Lambda 関数（lollab-backfill）を非同期で起動する。
BACKFILL_MODE=inline（既定）: API の応答後に同じプロセスで実行する（ローカル開発）。
"""

import logging

from fastapi import BackgroundTasks

from adapters import lambda_invoker
from config import settings
from services.summoner.backfill import run_backfill

logger = logging.getLogger(__name__)


async def dispatch_backfill(
    background_tasks: BackgroundTasks, region: str, puuid: str
) -> None:
    """Backfill を起動する。起動に失敗しても API の応答は失敗させない。

    Backfill は取りこぼしても、次回の検索・更新で続きから行われる。
    """
    if settings.backfill_mode != "lambda":
        background_tasks.add_task(run_backfill, region, puuid)
        return
    if not settings.backfill_function_name:
        logger.error("BACKFILL_FUNCTION_NAME が未設定のため Backfill を起動できません")
        return
    try:
        await lambda_invoker.invoke_async(
            settings.backfill_function_name, {"region": region, "puuid": puuid}
        )
    except Exception:
        logger.error("Backfill の Lambda 起動に失敗しました", exc_info=True)
