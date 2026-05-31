"""試合履歴取得サービス: Riot APIからサモナーの試合履歴を取得する。"""

import logging
from datetime import datetime, timezone

import httpx

from adapters import riot_api
from schemas.summoner import MatchData
from services.summoner._error import handle_riot_error
from services.summoner.region import get_regional

logger = logging.getLogger(__name__)


async def get_matches(
    region: str, game_name: str, tag_line: str, count: int
) -> list[MatchData]:
    """サモナーの試合履歴を取得する。

    Args:
        region: リージョン文字列（例: "JP", "KR"）
        game_name: ゲーム名（Riot ID のゲーム名部分）
        tag_line: タグライン（Riot ID のタグ部分）
        count: 取得する試合数

    Returns:
        list[MatchData]: 試合履歴データのリスト。個別取得失敗分はスキップ

    Raises:
        HTTPException: 404（サモナー未発見）、429（レート制限）、502（Riot API障害）
    """
    regional_host = get_regional(region)

    try:
        account = await riot_api.get(
            regional_host,
            f"/riot/account/v1/accounts/by-riot-id/{game_name}/{tag_line}",
        )
    except httpx.HTTPStatusError as e:
        handle_riot_error(e)

    puuid: str = account["puuid"]

    try:
        match_ids: list[str] = await riot_api.get(  # type: ignore[assignment]
            regional_host,
            f"/lol/match/v5/matches/by-puuid/{puuid}/ids?count={count}",
        )
    except httpx.HTTPStatusError as e:
        handle_riot_error(e)

    results: list[MatchData] = []
    for match_id in match_ids:
        try:
            match_detail = await riot_api.get(
                regional_host,
                f"/lol/match/v5/matches/{match_id}",
            )
            match_data = _build_match_data(match_detail, puuid)
            if match_data is not None:
                results.append(match_data)
        except Exception:
            logger.warning("試合詳細の取得に失敗しました: %s", match_id, exc_info=True)
            continue

    return results


def _build_match_data(
    match_detail: dict, puuid: str  # type: ignore[type-arg]
) -> MatchData | None:
    """試合詳細レスポンスとPUUIDからMatchDataを組み立てる。

    Args:
        match_detail: Riot APIの試合詳細レスポンス
        puuid: 対象プレイヤーのPUUID

    Returns:
        MatchData: 組み立てた試合データ。参加者が見つからない場合はNone
    """
    info = match_detail["info"]
    participants: list[dict] = info["participants"]  # type: ignore[type-arg]

    participant = next((p for p in participants if p.get("puuid") == puuid), None)
    if participant is None:
        logger.warning("参加者データが見つかりません: puuid=%s", puuid)
        return None

    game_end_timestamp_ms: int = info["gameEndTimestamp"]
    now_utc = datetime.now(timezone.utc)
    game_end_dt = datetime.fromtimestamp(game_end_timestamp_ms / 1000, tz=timezone.utc)
    time_ago_seconds = int((now_utc - game_end_dt).total_seconds())

    cs = participant["totalMinionsKilled"] + participant["neutralMinionsKilled"]
    item_ids = [participant[f"item{i}"] for i in range(7)]

    return MatchData(
        matchId=match_detail["metadata"]["matchId"],
        isWin=participant["win"],
        gameMode=info["gameMode"],
        championName=participant["championName"],
        kills=participant["kills"],
        deaths=participant["deaths"],
        assists=participant["assists"],
        cs=cs,
        gameDurationSeconds=info["gameDuration"],
        itemIds=item_ids,
        timeAgoSeconds=time_ago_seconds,
    )
