"""Riot API 取得サービス: Riot API からデータを取得し、保存用のモデルに変換する。

エラーの扱い:
- fetch_account_* / fetch_league / fetch_profile: 404・429・5xx を HTTPException に
  変換する（既存サービスと同じく handle_riot_error を使う）。接続エラー・タイムアウト
  （httpx.RequestError）は 502、送信前のレート制限（RateLimitExceeded）は 429 に変換する
- fetch_match_details は試合1件を「詳細 + タイムライン」で取得する（match_bundle.py）。
  タイムラインだけ失敗した試合は、詳細を残して FetchedMatch.timeline_error に記録する
- fetch_ranked_match_ids / fetch_match_details: httpx.HTTPStatusError を伝える。
  httpx.RequestError もそのまま伝える（sync_recent_matches が 502 に変換し、
  Backfill はログを出して終了する）。
  429 と送信前のレート制限は RiotRateLimitError にして、Backfill が検出して
  終了できるようにする（RiotRateLimitError は HTTPStatusError のサブクラスなので、
  handle_riot_error にそのまま渡せる）
- priority="backfill" を渡すと、2分あたりの残り回数が予約分を下回ったときに
  RiotRateLimitError になる
"""

import asyncio
import logging
from datetime import datetime
from typing import Any
from urllib.parse import quote

import httpx

from adapters import riot_api
from adapters.riot_rate_limiter import Priority, RateLimitExceeded
from schemas.riot_fetch import (
    AccountInfo,
    FailedFetch,
    FetchedMatch,
    LeagueInfo,
    MatchDetailsResult,
    ProfileInfo,
)
from services.summoner._error import (
    handle_rate_limit_exceeded,
    handle_request_error,
    handle_riot_error,
)
from services.summoner.league import parse_league
from services.summoner.match_bundle import fetch_match
from services.summoner.rank_position import get_rank_position
from services.summoner.region import get_platform, get_regional
from services.summoner.riot_errors import RiotRateLimitError, describe_fetch_error
from services.summoner.riot_request import get_riot

logger = logging.getLogger(__name__)

# 試合詳細の同時リクエスト数の上限
_MAX_CONCURRENT_REQUESTS = 10

# match-v5 の試合ID一覧で指定できる count の範囲
_MIN_MATCH_IDS_COUNT = 1
_MAX_MATCH_IDS_COUNT = 100


async def _get_or_http_exception(host: str, path: str) -> Any:
    """Riot API を呼ぶ。HTTP エラーは HTTPException に変換する。"""
    try:
        return await riot_api.get(host, path)
    except httpx.HTTPStatusError as e:
        handle_riot_error(e)
        raise  # handle_riot_error は必ず例外を送出するため到達しない
    except httpx.RequestError as e:
        handle_request_error(e)
    except RateLimitExceeded as e:
        handle_rate_limit_exceeded(e)


async def fetch_account_by_riot_id(
    region: str, game_name: str, tag_line: str
) -> AccountInfo:
    """RiotId からアカウント情報を取得する。"""
    path = (
        "/riot/account/v1/accounts/by-riot-id/"
        f"{quote(game_name, safe='')}/{quote(tag_line, safe='')}"
    )
    account = await _get_or_http_exception(get_regional(region), path)
    return AccountInfo(
        puuid=account["puuid"],
        game_name=account["gameName"],
        tag_line=account["tagLine"],
    )


async def fetch_account_by_puuid(region: str, puuid: str) -> AccountInfo:
    """PUUID からアカウント情報を取得する（RiotId 変更の反映用）。"""
    path = f"/riot/account/v1/accounts/by-puuid/{quote(puuid, safe='')}"
    account = await _get_or_http_exception(get_regional(region), path)
    return AccountInfo(
        puuid=account["puuid"],
        game_name=account["gameName"],
        tag_line=account["tagLine"],
    )


async def fetch_league(region: str, puuid: str) -> LeagueInfo:
    """ソロランクとフレックスの勝敗数を取得する（league-v4 を 1回呼ぶ）。"""
    entries = await _get_or_http_exception(
        get_platform(region), f"/lol/league/v4/entries/by-puuid/{quote(puuid, safe='')}"
    )
    return parse_league(entries)


async def fetch_profile(
    region: str, puuid: str, league: LeagueInfo | None = None
) -> ProfileInfo:
    """レベル・アイコン・ソロランク・ランク順位を取得する。

    Riot API の呼び出し回数: summoner-v4 1回 + league-v4 1回
    + ランク順位 0〜1回（UNRANKED は 0回）。
    league を渡した場合は、取得済みとして league-v4 を呼ばない。
    """
    summoner = await _get_or_http_exception(
        get_platform(region),
        f"/lol/summoner/v4/summoners/by-puuid/{quote(puuid, safe='')}",
    )
    if league is None:
        league = await fetch_league(region, puuid)
    rank = league.solo
    try:
        position = await get_rank_position(
            region, rank, puuid=puuid, summoner_id=league.solo_summoner_id
        )
    except httpx.RequestError as e:
        handle_request_error(e)

    return ProfileInfo(
        level=summoner["summonerLevel"],
        profile_icon_id=summoner["profileIconId"],
        rank=rank,
        flex_wins=league.flex_wins,
        flex_losses=league.flex_losses,
        # 0 は「不明」を表すため、DB では NULL として扱う
        rank_position=position.position if position and position.position > 0 else None,
        rank_total=(
            position.total_in_tier if position and position.total_in_tier > 0 else None
        ),
        rank_top_percent=position.top_percent if position else None,
    )


async def fetch_ranked_match_ids(
    region: str,
    puuid: str,
    *,
    start: int,
    count: int,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    priority: Priority = "interactive",
) -> list[str]:
    """ランク戦の試合ID一覧を新しい順に取得する。

    Args:
        region: リージョン文字列
        puuid: 対象の PUUID
        start: 取得開始位置
        count: 取得件数（1〜100）
        start_time: この日時以降に終了した試合のみ（タイムゾーン付き）
        end_time: この日時以前に終了した試合のみ（タイムゾーン付き）
        priority: レート制限の優先度（Backfill は "backfill"）

    Raises:
        ValueError: count が 1〜100 の範囲外
        httpx.HTTPStatusError: Riot API がエラーを返した（429 は RiotRateLimitError）
    """
    if not _MIN_MATCH_IDS_COUNT <= count <= _MAX_MATCH_IDS_COUNT:
        raise ValueError(
            f"count は {_MIN_MATCH_IDS_COUNT}〜{_MAX_MATCH_IDS_COUNT} で指定してください"
        )
    params: dict[str, str | int] = {"type": "ranked", "start": start, "count": count}
    if start_time is not None:
        params["startTime"] = int(start_time.timestamp())
    if end_time is not None:
        params["endTime"] = int(end_time.timestamp())

    path = f"/lol/match/v5/matches/by-puuid/{quote(puuid, safe='')}/ids"
    ids = await get_riot(get_regional(region), path, params, priority)
    return list(ids)


async def fetch_match_details(
    region: str,
    match_ids: list[str],
    priority: Priority = "interactive",
    timeline_only_ids: frozenset[str] = frozenset(),
) -> MatchDetailsResult:
    """試合（詳細 + タイムライン）を並列取得し、保存用レコードに変換する。

    同時に取得する試合数は 10 に制限する。試合詳細の取得・変換に失敗した試合
    （429 以外）はログに記録し、failures に match ID と短いエラー内容を入れる。
    タイムラインだけの失敗は fetched に残り、FetchedMatch.timeline_error に入る。
    fetched は match_ids の順。
    timeline_only_ids の試合は、試合詳細を保管済みの生データから読む（補完用）。

    Raises:
        RiotRateLimitError: 429 または送信前のレート制限。取得済みの試合は fetched
            （タイムライン取得中の 429 なら、その試合の詳細も含む）、
            個別に失敗した試合は failures に入っている。
            以降は、未開始のリクエストを送らない。
    """
    host = get_regional(region)
    semaphore = asyncio.Semaphore(_MAX_CONCURRENT_REQUESTS)
    rate_limited = asyncio.Event()
    failures: list[FailedFetch] = []
    limit_errors: list[RiotRateLimitError] = []

    async def _fetch_one(match_id: str) -> FetchedMatch | None:
        async with semaphore:
            if rate_limited.is_set():
                return None
            fetched: FetchedMatch | None
            limit: RiotRateLimitError | None
            try:
                fetched, limit = await fetch_match(
                    host,
                    match_id,
                    priority,
                    reuse_raw_detail=match_id in timeline_only_ids,
                )
            except RiotRateLimitError as e:
                limit = e
                fetched = None
            except Exception as e:
                logger.warning(
                    "試合詳細の取得に失敗しました: %s", match_id, exc_info=True
                )
                failures.append(
                    FailedFetch(match_id=match_id, error=describe_fetch_error(e))
                )
                return None
            if limit is not None:
                rate_limited.set()
                limit_errors.append(limit)
            return fetched

    results = await asyncio.gather(*(_fetch_one(m) for m in match_ids))

    fetched_matches = [r for r in results if r is not None]
    if limit_errors:
        error = limit_errors[0]
        error.fetched = fetched_matches
        error.failures = failures
        raise error
    return MatchDetailsResult(fetched=fetched_matches, failures=failures)
