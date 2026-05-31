"""サモナー検索APIルーター: HTTPリクエストのバリデーションとルーティングを担当する。"""

from typing import Annotated, Literal

from fastapi import APIRouter, Path, Query

from schemas.summoner import ChampionStatData, MatchData, RankPositionData, SummonerData
from services.summoner.champion_stats import get_champion_stats
from services.summoner.matches import get_matches
from services.summoner.profile import get_summoner_data
from services.summoner.rank_position import get_rank_position_for_summoner

router = APIRouter(prefix="/api/summoner")

Region = Literal["JP", "KR", "NA", "EUW", "EUNE", "OCE"]


@router.get("/{region}/{gameName}/{tagLine}")
async def get_summoner(
    region: Annotated[Region, Path()],
    gameName: Annotated[str, Path(min_length=1, max_length=16)],
    tagLine: Annotated[str, Path(min_length=1, max_length=5)],
) -> SummonerData:
    """サモナーのプロフィール・ランク情報を取得する。

    Args:
        region: リージョン（JP, KR, NA, EUW, EUNE, OCE）
        gameName: ゲーム名（Riot ID のゲーム名部分）
        tagLine: タグライン（Riot ID のタグ部分）

    Returns:
        SummonerData: サモナー情報・ランク情報

    Raises:
        HTTPException: 404（サモナー未発見）、429（レート制限）、502（Riot API障害）
    """
    return await get_summoner_data(region, gameName, tagLine)


@router.get("/{region}/{gameName}/{tagLine}/matches")
async def get_summoner_matches(
    region: Annotated[Region, Path()],
    gameName: Annotated[str, Path(min_length=1, max_length=16)],
    tagLine: Annotated[str, Path(min_length=1, max_length=5)],
    count: Annotated[int, Query(ge=1, le=20)] = 10,
) -> list[MatchData]:
    """サモナーの試合履歴を取得する。

    Args:
        region: リージョン（JP, KR, NA, EUW, EUNE, OCE）
        gameName: ゲーム名（Riot ID のゲーム名部分）
        tagLine: タグライン（Riot ID のタグ部分）
        count: 取得する試合数（1〜20、デフォルト10）

    Returns:
        list[MatchData]: 試合履歴データのリスト

    Raises:
        HTTPException: 404（サモナー未発見）、429（レート制限）、502（Riot API障害）
    """
    return await get_matches(region, gameName, tagLine, count)


@router.get("/{region}/{gameName}/{tagLine}/champion-stats")
async def get_summoner_champion_stats(
    region: Annotated[Region, Path()],
    gameName: Annotated[str, Path(min_length=1, max_length=16)],
    tagLine: Annotated[str, Path(min_length=1, max_length=5)],
) -> list[ChampionStatData]:
    """サモナーのチャンピオン別統計を取得する。

    Args:
        region: リージョン（JP, KR, NA, EUW, EUNE, OCE）
        gameName: ゲーム名（Riot ID のゲーム名部分）
        tagLine: タグライン（Riot ID のタグ部分）

    Returns:
        list[ChampionStatData]: チャンピオン別統計リスト（総試合数降順）

    Raises:
        HTTPException: 404（サモナー未発見）、429（レート制限）、502（Riot API障害）
    """
    return await get_champion_stats(region, gameName, tagLine)


@router.get("/{region}/{gameName}/{tagLine}/rank-position")
async def get_summoner_rank_position(
    region: Annotated[Region, Path()],
    gameName: Annotated[str, Path(min_length=1, max_length=16)],
    tagLine: Annotated[str, Path(min_length=1, max_length=5)],
) -> RankPositionData | None:
    """サモナーの同ティア内順位と全体上位%を取得する。

    Returns:
        RankPositionData: 順位情報。UNRANKEDの場合はnull
    """
    return await get_rank_position_for_summoner(region, gameName, tagLine)
