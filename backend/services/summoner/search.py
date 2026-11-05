"""サモナー検索サービス: 登録済みなら DB から返し、未登録なら初回登録する。"""

from datetime import datetime

from adapters import summoner_store
from schemas.summoner import SummonerDetail
from schemas.summoner_store import BackfillState, SummonerRecord
from services.summoner import riot_fetch
from services.summoner.detail import build_detail
from services.summoner.rank_record import record_rank_snapshots
from services.summoner.sync import (
    SYNC_MATCH_COUNT,
    build_summoner_record,
    sync_recent_matches,
)


async def search_summoner(
    region: str, game_name: str, tag_line: str
) -> tuple[SummonerDetail, str | None]:
    """サモナーを検索する。未登録なら Riot API から取得して登録する。

    Args:
        region: リージョン文字列（例: "JP"）
        game_name: ゲーム名（Riot ID のゲーム名部分）
        tag_line: タグライン（Riot ID のタグ部分）

    Returns:
        (詳細, Backfill 用 PUUID)。登録済みで Riot API を呼ばなかった場合、
        PUUID は None（Backfill 不要）。

    Raises:
        HTTPException: 404（アカウント未発見）、429（レート制限）、502（Riot API障害）
    """
    riot_id_lower = f"{game_name}#{tag_line}".lower()
    record = await summoner_store.find_summoner(region, riot_id_lower)
    if record is not None:
        return await build_detail(record), None

    record = await _register(region, game_name, tag_line)
    return await build_detail(record), record.puuid


async def _register(region: str, game_name: str, tag_line: str) -> SummonerRecord:
    """未登録のサモナーを Riot API から取得して保存する。

    PUUID が登録済みなら RiotId の変更とみなし、同じ行を新しい RiotId・
    プロフィールで更新する（Backfill のカーソルは変更しない）。
    """
    account = await riot_fetch.fetch_account_by_riot_id(region, game_name, tag_line)
    existing = await summoner_store.find_summoner_by_puuid(account.puuid, region)
    league = await riot_fetch.fetch_league(region, account.puuid)
    await record_rank_snapshots(region, account.puuid, league)
    profile = await riot_fetch.fetch_profile(region, account.puuid, league=league)
    match_ids = await sync_recent_matches(region, account.puuid)

    record = build_summoner_record(region, account, profile)
    await summoner_store.upsert_summoner(record)
    if existing is None:
        state = await _initial_backfill_state(match_ids, record.last_updated_at)
        await summoner_store.update_backfill_state(account.puuid, region, state)
    return record


async def _initial_backfill_state(
    match_ids: list[str], registered_at: datetime
) -> BackfillState:
    """初回登録時の Backfill カーソルを求める。

    synced_until は最新、backfill_cursor は最古の試合終了日時。
    保存済みで詳細を取得しなかった試合も含めて DB から求める。
    取得件数が SYNC_MATCH_COUNT 未満なら、履歴の最後まで取得済みとする。
    試合が0件なら synced_until を登録時刻にする（登録後の試合を Backfill の
    フェーズAで取得するため）。
    """
    if not match_ids:
        return BackfillState(synced_until=registered_at, backfill_completed=True)
    end_times = list((await summoner_store.get_match_end_times(match_ids)).values())
    return BackfillState(
        synced_until=max(end_times) if end_times else None,
        backfill_cursor=min(end_times) if end_times else None,
        backfill_completed=len(match_ids) < SYNC_MATCH_COUNT,
    )
