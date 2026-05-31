"""ランク順位算出サービス: 同ティア内順位と全体上位%を算出する。"""

import logging

import httpx

from adapters import riot_api
from schemas.summoner import RankData, RankPositionData
from services.summoner._error import handle_riot_error
from services.summoner.region import get_platform, get_regional

logger = logging.getLogger(__name__)

# 各ティアの推定人口比率（全体に対する%）
_TIER_POPULATION_PERCENT: dict[str, float] = {
    "IRON": 4.0,
    "BRONZE": 18.0,
    "SILVER": 25.0,
    "GOLD": 25.0,
    "PLATINUM": 14.0,
    "EMERALD": 8.0,
    "DIAMOND": 4.0,
    "MASTER": 1.0,
    "GRANDMASTER": 0.5,
    "CHALLENGER": 0.02,
}


class RankPositionResult:
    """ランク順位算出結果"""

    def __init__(self, position: int, total_in_tier: int, top_percent: float) -> None:
        self.position = position
        self.total_in_tier = total_in_tier
        self.top_percent = top_percent


async def get_rank_position(
    region: str, rank: RankData, summoner_id: str
) -> RankPositionResult | None:
    """同ティア内の順位と全体上位%を算出する。

    Args:
        region: リージョン文字列
        rank: サモナーのランクデータ
        summoner_id: サモナーID（league-v4のエントリ照合用）

    Returns:
        RankPositionResult: 順位情報。UNRANKEDの場合はNone
    """
    if rank.tier == "UNRANKED":
        return None

    platform_host = get_platform(region)

    # Master以上はleague-v4の専用エンドポイントを使用
    if rank.tier in ("MASTER", "GRANDMASTER", "CHALLENGER"):
        return await _get_apex_position(platform_host, rank, summoner_id)

    return await _get_division_position(platform_host, rank, summoner_id)


async def _get_apex_position(
    platform_host: str, rank: RankData, summoner_id: str
) -> RankPositionResult | None:
    """Master以上のティアの順位を取得する。"""
    tier_path = rank.tier.lower()
    path = f"/lol/league/v4/{tier_path}leagues/by-queue/RANKED_SOLO_5x5"

    try:
        league_data = await riot_api.get(platform_host, path)
    except httpx.HTTPStatusError as e:
        handle_riot_error(e)

    entries = league_data.get("entries", [])
    # LP降順でソート
    sorted_entries = sorted(entries, key=lambda x: x["leaguePoints"], reverse=True)

    position = 1
    for entry in sorted_entries:
        if entry.get("summonerId") == summoner_id:
            total = len(sorted_entries)
            top_percent = _calc_top_percent(rank.tier, position, total)
            return RankPositionResult(position, total, top_percent)
        position += 1

    return None


async def _get_division_position(
    platform_host: str, rank: RankData, summoner_id: str
) -> RankPositionResult | None:
    """Diamond以下のティアの順位を取得する（1ページ目のみ）。"""
    path = f"/lol/league/v4/entries/RANKED_SOLO_5x5" f"/{rank.tier}/{rank.rank}?page=1"

    try:
        entries = await riot_api.get(platform_host, path)
    except httpx.HTTPStatusError as e:
        handle_riot_error(e)

    # LP降順でソート
    sorted_entries = sorted(entries, key=lambda x: x["leaguePoints"], reverse=True)

    position = 1
    for entry in sorted_entries:
        if entry.get("summonerId") == summoner_id:
            total = len(sorted_entries)
            top_percent = _calc_top_percent(rank.tier, position, total)
            return RankPositionResult(position, total, top_percent)
        position += 1

    # 1ページ目に見つからない場合はLP基準で推定
    top_percent = _calc_top_percent(rank.tier, 0, 0)
    return RankPositionResult(0, 0, top_percent)


def _calc_top_percent(tier: str, position: int, total_in_tier: int) -> float:
    """全体上位%を概算する。

    上位ティアの人口 + 現ティア内での相対位置から算出。
    """
    tiers_above = [
        "CHALLENGER",
        "GRANDMASTER",
        "MASTER",
        "DIAMOND",
        "EMERALD",
        "PLATINUM",
        "GOLD",
        "SILVER",
        "BRONZE",
        "IRON",
    ]

    percent_above = 0.0
    for t in tiers_above:
        if t == tier:
            break
        percent_above += _TIER_POPULATION_PERCENT.get(t, 0.0)

    # ティア内での相対位置を加算
    tier_percent = _TIER_POPULATION_PERCENT.get(tier, 1.0)
    if total_in_tier > 0 and position > 0:
        in_tier_ratio = position / total_in_tier
        percent_above += tier_percent * in_tier_ratio
    else:
        # 推定不能な場合はティアの中央値
        percent_above += tier_percent * 0.5

    return round(percent_above, 4)


async def get_rank_position_for_summoner(
    region: str, game_name: str, tag_line: str
) -> RankPositionData | None:
    """サモナー名からランク順位情報を取得するファサード。"""
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

    # ソロランクを抽出
    rank = None
    summoner_id = ""
    for entry in league_entries:
        if entry.get("queueType") == "RANKED_SOLO_5x5":
            summoner_id = entry.get("summonerId", "")
            rank = RankData(
                queueType="RANKED_SOLO_5x5",
                tier=entry["tier"],
                rank=entry["rank"],
                leaguePoints=entry["leaguePoints"],
                wins=entry["wins"],
                losses=entry["losses"],
            )
            break

    if rank is None or rank.tier == "UNRANKED":
        return None

    result = await get_rank_position(region, rank, summoner_id)
    if result is None:
        return None

    return RankPositionData(
        position=result.position,
        totalPlayers=result.total_in_tier,
        topPercent=result.top_percent,
    )
