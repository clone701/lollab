"""チャンピオンビルド集計用のデータ取得層（Supabase）。

services 層はこのモジュールの関数だけを使い、Supabase を直接参照しない。
Supabase クライアントは同期 API のため、query_runner 経由で asyncio.to_thread から呼ぶ。
どの関数もリメイク（is_remake = true）の試合を除外する。
"""

import logging
import re
from collections import Counter
from collections.abc import Callable
from typing import Any

from postgrest.types import CountMethod

from adapters.query_runner import execute as _execute
from adapters.query_runner import execute_count as _execute_count
from adapters.supabase import supabase
from schemas.champion_store import BuildRow, StatsFilter

logger = logging.getLogger(__name__)

# PostgREST の1リクエストあたりの最大行数（Supabase の既定値）
_PAGE_SIZE = 1000

# 最新パッチの判定に使う直近の試合数
_RECENT_MATCHES_FOR_PATCH = 50

_PATCH_PATTERN = re.compile(r"(\d+)\.(\d+)")

_BUILD_COLUMNS = (
    "win,spell1_id,spell2_id,primary_style_id,sub_style_id,"
    "primary_perk_ids,sub_perk_ids,stat_perk_ids,"
    "skill_order,starting_items,completed_items"
)


def _scope(query: Any, filters: StatsFilter, prefix: str = "") -> Any:
    """リメイク除外・キュー・期間の条件を query に追加する。

    prefix は、埋め込んだ matches の列に条件を付けるときに "matches." を渡す。
    """
    query = query.eq(f"{prefix}is_remake", False).in_(
        f"{prefix}queue_id", filters.queue_ids
    )
    if filters.patch is not None:
        query = query.eq(f"{prefix}patch", filters.patch)
    if filters.since is not None:
        query = query.gte(f"{prefix}game_end_at", filters.since.isoformat())
    return query


async def _fetch_all(build_page: Callable[[int], Any]) -> list[dict[str, Any]]:
    """build_page(offset) が返すクエリを、行数上限ごとのページ単位で全件取得する。"""
    results: list[dict[str, Any]] = []
    offset = 0
    while True:
        rows = await _execute(lambda: build_page(offset))
        results.extend(rows)
        if len(rows) < _PAGE_SIZE:
            return results
        offset += _PAGE_SIZE


def _participants(columns: str, champion_name: str, filters: StatsFilter) -> Any:
    """チャンピオン・期間・キュー・リメイク除外で絞った match_participants のクエリ。"""
    query = supabase.table("match_participants").select(columns)
    return _scope(query.eq("champion_name", champion_name), filters)


def _count_query(table: str, columns: str = "match_id") -> Any:
    """行数だけを取得する（データを返さない）クエリ。"""
    return supabase.table(table).select(columns, count=CountMethod.exact, head=True)


def _patch_key(patch: str) -> tuple[int, int] | None:
    """ "major.minor" を数値の組にする。形式が合わなければ None。"""
    matched = _PATCH_PATTERN.fullmatch(patch)
    return (int(matched[1]), int(matched[2])) if matched else None


async def get_latest_patch() -> str | None:
    """最新パッチを返す。試合がなければ None。

    パッチは時系列で増えるため、終了日時が最も新しい試合群のパッチを最新とみなす。
    "16.9" と "16.22" は文字列順では逆になるため、DB の並べ替えは使わず、
    直近の試合のパッチを数値として比較して最大のものを選ぶ
    （パッチの切り替え直後に旧パッチの試合が後から終わる場合に備える）。
    """
    rows = await _execute(
        lambda: supabase.table("matches")
        .select("patch")
        .filter("patch", "not.is", "null")
        .order("game_end_at", desc=True)
        .limit(_RECENT_MATCHES_FOR_PATCH)
    )
    keyed = [
        (key, str(row["patch"]))
        for row in rows
        if (key := _patch_key(str(row["patch"])))
    ]
    return max(keyed)[1] if keyed else None


async def get_champion_id(champion_name: str) -> int | None:
    """champion_name に対応する champion_id を返す。参加記録がなければ None。"""
    rows = await _execute(
        lambda: supabase.table("match_participants")
        .select("champion_id")
        .eq("champion_name", champion_name)
        .limit(1)
    )
    return int(rows[0]["champion_id"]) if rows else None


async def get_build_rows(
    champion_name: str, role: str | None, filters: StatsFilter
) -> list[BuildRow]:
    """ビルド集計に使う列だけを、条件に合う参加者ごとに全件返す。role が None ならロール不問。"""

    def _page(offset: int) -> Any:
        query = _participants(_BUILD_COLUMNS, champion_name, filters)
        if role is not None:
            query = query.eq("team_position", role)
        return (
            query.order("match_id")
            .order("puuid")
            .range(offset, offset + _PAGE_SIZE - 1)
        )

    return [BuildRow.model_validate(row) for row in await _fetch_all(_page)]


async def count_role_games(champion_name: str, filters: StatsFilter) -> dict[str, int]:
    """チャンピオンのロール別の試合数を返す。ロールが空文字の行は含めない。"""

    def _page(offset: int) -> Any:
        return (
            _participants("team_position", champion_name, filters)
            .order("match_id")
            .order("puuid")
            .range(offset, offset + _PAGE_SIZE - 1)
        )

    rows = await _fetch_all(_page)
    counts = Counter(row["team_position"] for row in rows if row["team_position"])
    return dict(counts)


async def get_role_win_totals(role: str, filters: StatsFilter) -> tuple[int, int]:
    """条件に合うロールの全参加者の (試合数, 勝利数) を返す。"""

    def _query() -> Any:
        return _scope(
            _count_query("match_participants").eq("team_position", role), filters
        )

    total = await _execute_count(_query)
    wins = await _execute_count(lambda: _query().eq("win", True))
    return total, wins


async def count_matches(filters: StatsFilter) -> int:
    """条件に合う試合の総数を返す。"""
    return await _execute_count(lambda: _scope(_count_query("matches"), filters))


async def count_bans(champion_id: int, filters: StatsFilter) -> int:
    """チャンピオンが BAN された試合数を返す。

    match_bans を matches と内部結合し、期間・キュー・リメイクは matches 側の列で絞る。
    """

    def _query() -> Any:
        query = _count_query("match_bans", "match_id,matches!inner(match_id)")
        return _scope(query.eq("champion_id", champion_id), filters, "matches.")

    return await _execute_count(_query)
