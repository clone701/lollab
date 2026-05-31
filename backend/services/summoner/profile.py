"""サモナープロフィール取得サービス: Riot APIからサモナー情報・ランク情報を取得する。"""

import logging

import httpx

from adapters import riot_api
from schemas.summoner import RankData, SummonerData
from services.summoner._error import handle_riot_error
from services.summoner.region import get_platform, get_regional

logger = logging.getLogger(__name__)

_UNRANKED_DEFAULT = RankData(
    queueType="RANKED_SOLO_5x5",
    tier="UNRANKED",
    rank="",
    leaguePoints=0,
    wins=0,
    losses=0,
)


async def get_summoner_data(region: str, game_name: str, tag_line: str) -> SummonerData:
    """サモナーのプロフィール・ランク情報を取得する。

    Args:
        region: リージョン文字列（例: "JP", "KR"）
        game_name: ゲーム名（Riot ID のゲーム名部分）
        tag_line: タグライン（Riot ID のタグ部分）

    Returns:
        SummonerData: サモナー情報・ランク情報を含むデータ

    Raises:
        HTTPException: 404（サモナー未発見）、429（レート制限）、502（Riot API障害）
    """
    regional_host = get_regional(region)
    platform_host = get_platform(region)

    try:
        account = await riot_api.get(
            regional_host,
            f"/riot/account/v1/accounts/by-riot-id/{game_name}/{tag_line}",
        )
    except httpx.HTTPStatusError as e:
        handle_riot_error(e)

    puuid: str = account["puuid"]

    try:
        summoner = await riot_api.get(
            platform_host,
            f"/lol/summoner/v4/summoners/by-puuid/{puuid}",
        )
    except httpx.HTTPStatusError as e:
        handle_riot_error(e)

    try:
        league_entries: list[dict] = await riot_api.get(  # type: ignore[assignment]
            platform_host,
            f"/lol/league/v4/entries/by-puuid/{puuid}",
        )
    except httpx.HTTPStatusError as e:
        handle_riot_error(e)

    rank_data = _extract_solo_rank(league_entries)

    return SummonerData(
        name=account["gameName"],
        tagLine=account["tagLine"],
        level=summoner["summonerLevel"],
        profileIconId=summoner["profileIconId"],
        rank=rank_data,
    )


def _extract_solo_rank(entries: list[dict]) -> RankData:  # type: ignore[type-arg]
    """ランクエントリーリストからソロランクデータを抽出する。

    Args:
        entries: Riot APIから取得したランクエントリーリスト

    Returns:
        RankData: ソロランクデータ。データなし時はUNRANKEDデフォルト値
    """
    for entry in entries:
        if entry.get("queueType") == "RANKED_SOLO_5x5":
            return RankData(
                queueType="RANKED_SOLO_5x5",
                tier=entry["tier"],
                rank=entry["rank"],
                leaguePoints=entry["leaguePoints"],
                wins=entry["wins"],
                losses=entry["losses"],
            )
    return _UNRANKED_DEFAULT
