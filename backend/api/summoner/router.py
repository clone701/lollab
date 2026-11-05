"""サモナー検索APIルーター: HTTPリクエストのバリデーションとルーティングを担当する。"""

import logging
from collections.abc import Awaitable
from typing import Annotated, Literal, TypeVar

from fastapi import APIRouter, BackgroundTasks, HTTPException, Path

from schemas.summoner import SummonerDetail
from services.summoner.backfill import run_backfill
from services.summoner.search import search_summoner
from services.summoner.update import update_summoner

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/summoner")

Region = Literal["JP", "KR", "NA", "EUW", "EUNE", "OCE"]

T = TypeVar("T")


async def _convert_unexpected_errors(call: Awaitable[T]) -> T:
    """HTTPException 以外の例外（DB 例外など）を 500 に変換する。

    詳細はログに記録し、応答にはスタックトレースや内部情報を含めない。
    """
    try:
        return await call
    except HTTPException:
        raise
    except Exception:
        logger.error("サモナー API で予期しないエラーが発生しました", exc_info=True)
        raise HTTPException(
            status_code=500, detail="サーバーエラーが発生しました"
        ) from None


@router.get("/{region}/{gameName}/{tagLine}")
async def get_summoner(
    region: Annotated[Region, Path()],
    gameName: Annotated[str, Path(min_length=1, max_length=16)],
    tagLine: Annotated[str, Path(min_length=1, max_length=5)],
    background_tasks: BackgroundTasks,
) -> SummonerDetail:
    """サモナーの詳細を取得する。未登録なら初回登録し、応答後に Backfill を開始する。

    Args:
        region: リージョン（JP, KR, NA, EUW, EUNE, OCE）
        gameName: ゲーム名（Riot ID のゲーム名部分）
        tagLine: タグライン（Riot ID のタグ部分）

    Returns:
        SummonerDetail: プロフィール・ランク順位・試合履歴・チャンピオン統計

    Raises:
        HTTPException: 404（サモナー未発見）、429（レート制限）、
            500（サーバーエラー）、502（Riot API障害）
    """
    detail, puuid = await _convert_unexpected_errors(
        search_summoner(region, gameName, tagLine)
    )
    if puuid is not None:
        background_tasks.add_task(run_backfill, region, puuid)
    return detail


@router.post("/{region}/{gameName}/{tagLine}/update")
async def update_summoner_detail(
    region: Annotated[Region, Path()],
    gameName: Annotated[str, Path(min_length=1, max_length=16)],
    tagLine: Annotated[str, Path(min_length=1, max_length=5)],
    background_tasks: BackgroundTasks,
) -> SummonerDetail:
    """登録済みサモナーを Riot API から更新し、必要なら応答後に Backfill を開始する。

    Raises:
        HTTPException: 404（未登録）、429（レート制限）、
            500（サーバーエラー）、502（Riot API障害）
    """
    detail, puuid = await _convert_unexpected_errors(
        update_summoner(region, gameName, tagLine)
    )
    if puuid is not None:
        background_tasks.add_task(run_backfill, region, puuid)
    return detail
