"""試合カードに表示する、試合ごとの参加者10人の読み出し（match_participants）。

Supabase クライアントは同期 API のため、query_runner 経由で呼び出す。
"""

from collections import defaultdict

from adapters.query_runner import execute as _execute
from adapters.supabase import supabase
from schemas.summoner_store import MatchMemberRecord

# 1回に問い合わせる試合ID数（1試合10行 × 50 = 500行 < PostgREST の上限1000行）
_MATCH_ID_CHUNK_SIZE = 50

_COLUMNS = (
    "match_id, puuid, riot_id_game_name, riot_id_tagline, "
    "team_id, team_position, champion_name, kills"
)


async def get_members_by_match(
    match_ids: list[str],
) -> dict[str, list[MatchMemberRecord]]:
    """試合IDごとの参加者を {match_id: [参加者]} で返す。並びは保証しない。

    match_participants に行がない試合は結果に含めない。
    PostgREST の行数上限を超えないよう、_MATCH_ID_CHUNK_SIZE 件ずつ問い合わせる。
    """
    members: dict[str, list[MatchMemberRecord]] = defaultdict(list)
    for i in range(0, len(match_ids), _MATCH_ID_CHUNK_SIZE):
        chunk = match_ids[i : i + _MATCH_ID_CHUNK_SIZE]
        rows = await _execute(
            lambda: supabase.table("match_participants")
            .select(_COLUMNS)
            .in_("match_id", chunk)
        )
        for row in rows:
            record = MatchMemberRecord.model_validate(row)
            members[record.match_id].append(record)
    return dict(members)
