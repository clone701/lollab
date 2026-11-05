"""同期処理の共通部分: 検索（初回登録）・手動更新・Backfill が使う取得と保存。"""

from datetime import datetime, timezone

import httpx

from adapters import summoner_store
from schemas.riot_fetch import AccountInfo, FetchedMatch, ProfileInfo
from schemas.summoner_store import SummonerRecord
from services.summoner import riot_fetch
from services.summoner._error import handle_request_error, handle_riot_error

# 初回登録・手動更新の同期部分で取得する試合数
SYNC_MATCH_COUNT = 20


async def save_fetched(fetched: list[FetchedMatch]) -> None:
    """取得済みの試合を Summoner_Store に保存する。空なら何もしない。"""
    if not fetched:
        return
    await summoner_store.save_matches(
        [f.match for f in fetched],
        [p for f in fetched for p in f.participants],
        [b for f in fetched for b in f.bans],
    )


async def fetch_and_save_unsaved(region: str, match_ids: list[str]) -> None:
    """match_ids のうち未保存の試合だけ詳細を取得して保存する。

    Raises:
        RiotRateLimitError: 429 を受けた。429 前に取得できた試合は保存してから送出する。
        httpx.HTTPStatusError: その他の Riot API エラー
    """
    unsaved = await summoner_store.filter_unsaved_match_ids(match_ids)
    if not unsaved:
        return
    try:
        result = await riot_fetch.fetch_match_details(region, unsaved)
    except riot_fetch.RiotRateLimitError as e:
        await save_fetched(e.fetched)
        raise
    await save_fetched(result.fetched)


async def sync_recent_matches(region: str, puuid: str) -> list[str]:
    """直近 SYNC_MATCH_COUNT 件の対象試合のうち未保存分を取得して保存する。

    Riot API のエラーは、取得できた試合を保存した後に HTTPException に変換する。

    Returns:
        直近の試合ID一覧（新しい順。保存済みのものも含む）

    Raises:
        HTTPException: 404, 429, 502
    """
    try:
        match_ids = await riot_fetch.fetch_ranked_match_ids(
            region, puuid, start=0, count=SYNC_MATCH_COUNT
        )
        await fetch_and_save_unsaved(region, match_ids)
    except httpx.HTTPStatusError as e:
        handle_riot_error(e)
        raise  # handle_riot_error は必ず例外を送出するため到達しない
    except httpx.RequestError as e:
        handle_request_error(e)
    return match_ids


def build_summoner_record(
    region: str, account: AccountInfo, profile: ProfileInfo
) -> SummonerRecord:
    """アカウントとプロフィールから summoners の行を作る（last_updated_at は現在時刻）。"""
    return SummonerRecord(
        puuid=account.puuid,
        region=region,
        game_name=account.game_name,
        tag_line=account.tag_line,
        riot_id_lower=f"{account.game_name}#{account.tag_line}".lower(),
        level=profile.level,
        profile_icon_id=profile.profile_icon_id,
        solo_tier=profile.rank.tier,
        solo_rank=profile.rank.rank,
        solo_lp=profile.rank.leaguePoints,
        solo_wins=profile.rank.wins,
        solo_losses=profile.rank.losses,
        flex_wins=profile.flex_wins,
        flex_losses=profile.flex_losses,
        rank_position=profile.rank_position,
        rank_total=profile.rank_total,
        rank_top_percent=profile.rank_top_percent,
        last_updated_at=datetime.now(timezone.utc),
    )
