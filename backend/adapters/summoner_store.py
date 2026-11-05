"""Summoner_Store（Supabase）へのアクセス層。

services 層はこのモジュールの関数だけを使い、Supabase を直接参照しない。
Supabase クライアントは同期 API のため、すべて asyncio.to_thread で呼び出す。
"""

import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any

from postgrest.types import ReturnMethod
from pydantic import TypeAdapter

from adapters.query_runner import execute as _execute
from adapters.supabase import supabase
from adapters.upsert_rows import MATCH_ROWS, PART_ROWS, dump_rows
from schemas.summoner_store import (
    BackfillState,
    BanRecord,
    MatchRecord,
    ParticipantRecord,
    ParticipationRecord,
    SeasonRecord,
    SummonerRecord,
)

# Backfill の二重実行を防ぐ期間
_BACKFILL_LOCK_MINUTES = 10

# PostgREST の1リクエストあたりの最大行数（Supabase の既定値）
_PAGE_SIZE = 1000

# 保存済み判定で1回に問い合わせる試合ID数（1試合10行 × 50 = 500行 < _PAGE_SIZE）
_MATCH_ID_CHUNK_SIZE = 50

# 終了日時の問い合わせで1回に渡す試合ID数（1試合1行）
_MATCH_TIMES_CHUNK_SIZE = 100

_DATETIME = TypeAdapter(datetime)

# upsert_summoner で書き込まない列。
# Backfill の状態と DB 管理の列を、同期処理の upsert で巻き戻さないため除外する。
_SUMMONER_UPSERT_EXCLUDE = {
    "synced_until",
    "backfill_cursor",
    "backfill_completed",
    "backfill_started_at",
    "created_at",
}


async def find_summoner(region: str, riot_id_lower: str) -> SummonerRecord | None:
    """region と小文字 RiotId でサモナーを検索する。

    同一 RiotId の行が複数ある場合は last_updated_at が新しい行を返す。
    """
    rows = await _execute(
        lambda: supabase.table("summoners")
        .select("*")
        .eq("region", region)
        .eq("riot_id_lower", riot_id_lower)
        .order("last_updated_at", desc=True)
        .limit(1)
    )
    return SummonerRecord.model_validate(rows[0]) if rows else None


async def find_summoner_by_puuid(puuid: str, region: str) -> SummonerRecord | None:
    """PUUID と region でサモナーを検索する。"""
    rows = await _execute(
        lambda: supabase.table("summoners")
        .select("*")
        .eq("puuid", puuid)
        .eq("region", region)
        .limit(1)
    )
    return SummonerRecord.model_validate(rows[0]) if rows else None


async def upsert_summoner(record: SummonerRecord) -> None:
    """サモナーを (puuid, region) をキーに upsert する。

    Backfill 関連の列（synced_until, backfill_cursor, backfill_completed,
    backfill_started_at）と created_at は書き込まない。
    Backfill の状態は update_backfill_state / try_start_backfill で更新する。
    """
    payload = record.model_dump(mode="json", exclude=_SUMMONER_UPSERT_EXCLUDE)
    await _execute(
        lambda: supabase.table("summoners").upsert(payload, on_conflict="puuid,region")
    )


async def update_last_updated_at(
    puuid: str, region: str, last_updated_at: datetime
) -> None:
    """last_updated_at だけを更新する（他の列は変更しない）。"""
    payload = {"last_updated_at": last_updated_at.isoformat()}
    await _execute(
        lambda: supabase.table("summoners")
        .update(payload)
        .eq("puuid", puuid)
        .eq("region", region)
    )


async def update_backfill_state(puuid: str, region: str, state: BackfillState) -> None:
    """Backfill のカーソルと完了フラグを更新する。"""
    payload = state.model_dump(mode="json")
    await _execute(
        lambda: supabase.table("summoners")
        .update(payload)
        .eq("puuid", puuid)
        .eq("region", region)
    )


async def try_start_backfill(puuid: str, region: str) -> bool:
    """Backfill の開始を試みる。

    backfill_started_at が10分以内なら False。そうでなければ現在時刻を書き込んで
    True を返す。判定と書き込みは1回の UPDATE で行い、同時呼び出しでも
    開始できるのは1つだけにする。
    """
    now = datetime.now(timezone.utc)
    threshold = now - timedelta(minutes=_BACKFILL_LOCK_MINUTES)
    # or_ の値に含まれる "+" や小数点を避けるため、秒精度の Z 形式で渡す
    threshold_text = threshold.strftime("%Y-%m-%dT%H:%M:%SZ")
    condition = f"backfill_started_at.is.null,backfill_started_at.lt.{threshold_text}"

    rows = await _execute(
        lambda: supabase.table("summoners")
        .update({"backfill_started_at": now.isoformat()})
        .eq("puuid", puuid)
        .eq("region", region)
        .or_(condition)
    )
    return len(rows) > 0


async def filter_unsaved_match_ids(match_ids: list[str]) -> list[str]:
    """match_ids のうち、match_participants に行がない ID を入力順のまま返す。

    save_matches は matches → match_participants の2回の upsert で原子的でないため、
    matches だけ残った試合も未保存として扱い、再取得できるようにする。
    1試合につき10行返るため、PostgREST の行数上限（1000行）を超えないよう
    _MATCH_ID_CHUNK_SIZE 件ずつ問い合わせる。
    """
    saved: set[str] = set()
    for i in range(0, len(match_ids), _MATCH_ID_CHUNK_SIZE):
        chunk = match_ids[i : i + _MATCH_ID_CHUNK_SIZE]
        rows = await _execute(
            lambda: supabase.table("match_participants")
            .select("match_id")
            .in_("match_id", chunk)
        )
        saved.update(row["match_id"] for row in rows)
    return [match_id for match_id in match_ids if match_id not in saved]


async def get_match_end_times(match_ids: list[str]) -> dict[str, datetime]:
    """保存済みの試合の終了日時を {match_id: game_end_at} で返す。

    matches に行がない ID（未保存・取得失敗でスキップした試合）は結果に含めない。
    Backfill のカーソルを、保存済みで詳細を取得しなかった試合も含めて求めるために使う。
    """
    result: dict[str, datetime] = {}
    for i in range(0, len(match_ids), _MATCH_TIMES_CHUNK_SIZE):
        chunk = match_ids[i : i + _MATCH_TIMES_CHUNK_SIZE]
        rows = await _execute(
            lambda: supabase.table("matches")
            .select("match_id, game_end_at")
            .in_("match_id", chunk)
        )
        for row in rows:
            result[row["match_id"]] = _DATETIME.validate_python(row["game_end_at"])
    return result


async def save_matches(
    matches: list[MatchRecord],
    participants: list[ParticipantRecord],
    bans: list[BanRecord] | None = None,
) -> None:
    """試合・参加者・BAN を upsert する。主キー衝突時は上書きするため冪等。

    参加者と BAN は matches への外部キーを持つため、matches を先に書き込む。
    タイムライン由来の列は、値がある行だけ書き込む（詳細の取り直しで
    取り込み済みの値を NULL で上書きしない。dump_rows を参照）。
    """
    if not matches:
        return
    batches = [
        ("matches", "match_id", dump_rows(matches, **MATCH_ROWS)),
        ("match_participants", "match_id,puuid", dump_rows(participants, **PART_ROWS)),
        (
            "match_bans",
            "match_id,team_id,pick_turn",
            [[b.model_dump() for b in bans or []]],
        ),
    ]

    # 書き込んだ行は使わないため、レスポンスには含めない（returning=minimal）
    def _query() -> None:
        for table, conflict, groups in batches:
            for rows in filter(None, groups):
                supabase.table(table).upsert(
                    rows, on_conflict=conflict, returning=ReturnMethod.minimal
                ).execute()

    await asyncio.to_thread(_query)


def _to_participation(row: dict[str, Any]) -> ParticipationRecord:
    """match_participants の行（matches を埋め込み済み）を ParticipationRecord にする。"""
    flat = {k: v for k, v in row.items() if k != "matches"}
    flat["game_mode"] = row["matches"]["game_mode"]
    flat["game_duration"] = row["matches"]["game_duration"]
    return ParticipationRecord.model_validate(flat)


def _participations_query(puuid: str) -> Any:
    """サモナーの参加記録に matches の game_mode / game_duration を埋め込むクエリ。"""
    return (
        supabase.table("match_participants")
        .select("*, matches(game_mode, game_duration)")
        .eq("puuid", puuid)
    )


async def get_recent_participations(
    puuid: str, limit: int
) -> list[ParticipationRecord]:
    """サモナーの直近の参加記録を新しい順に最大 limit 件返す。"""
    rows = await _execute(
        lambda: _participations_query(puuid)
        .order("game_end_at", desc=True)
        .limit(limit)
    )
    return [_to_participation(row) for row in rows]


async def get_participations_between(
    puuid: str, start: datetime | None, end: datetime | None
) -> list[ParticipationRecord]:
    """start 以上 end 未満の参加記録を新しい順に返す。両方 None で全期間。

    PostgREST の行数上限を超える場合に備え、ページ単位で全件取得する。
    """

    def _page(offset: int) -> Any:
        query = _participations_query(puuid)
        if start is not None:
            query = query.gte("game_end_at", start.isoformat())
        if end is not None:
            query = query.lt("game_end_at", end.isoformat())
        return (
            query.order("game_end_at", desc=True)
            .order("match_id")
            .range(offset, offset + _PAGE_SIZE - 1)
        )

    results: list[ParticipationRecord] = []
    offset = 0
    while True:
        rows = await _execute(lambda: _page(offset))
        results.extend(_to_participation(row) for row in rows)
        if len(rows) < _PAGE_SIZE:
            return results
        offset += _PAGE_SIZE


async def get_current_season() -> SeasonRecord | None:
    """現行シーズン（end_at が NULL）を返す。未登録なら None。"""
    rows = await _execute(
        lambda: supabase.table("seasons")
        .select("*")
        .is_("end_at", "null")
        .order("start_at", desc=True)
        .limit(1)
    )
    return SeasonRecord.model_validate(rows[0]) if rows else None
