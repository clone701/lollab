"""サモナー手動更新サービス: 同期部分（プロフィール・ランク・直近20件）を担当する。

最初に league entries を取得し、ソロ + フレックスの勝敗数の合計が保存済みの値と
同じなら、新しいランク戦はないとみなして last_updated_at だけを更新する。
"""

from datetime import datetime, timezone

from fastapi import HTTPException

from adapters import summoner_store
from schemas.summoner import SummonerDetail
from schemas.summoner_store import SummonerRecord
from services.summoner import riot_fetch
from services.summoner.detail import build_detail
from services.summoner.sync import build_summoner_record, sync_recent_matches


async def update_summoner(
    region: str, game_name: str, tag_line: str
) -> tuple[SummonerDetail, str | None]:
    """登録済みサモナーを Riot API から更新する。

    Riot API でエラーが起きた場合は、取得できた試合を保存し、
    last_updated_at を変えずにエラーを送出する。
    Backfill のカーソルは変更しない。

    Args:
        region: リージョン文字列（例: "JP"）
        game_name: ゲーム名（Riot ID のゲーム名部分）
        tag_line: タグライン（Riot ID のタグ部分）

    Returns:
        (詳細, Backfill 用 PUUID)。勝敗数の合計が同じで Backfill も完了済みの場合、
        PUUID は None（Backfill 不要）。

    Raises:
        HTTPException: 404（未登録）、429（レート制限）、502（Riot API障害）
    """
    riot_id_lower = f"{game_name}#{tag_line}".lower()
    record = await summoner_store.find_summoner(region, riot_id_lower)
    if record is None:
        raise HTTPException(status_code=404, detail="サモナーが見つかりません")

    league = await riot_fetch.fetch_league(region, record.puuid)
    if league.total_games == _stored_total_games(record):
        return await _touch_only(record)

    account = await riot_fetch.fetch_account_by_puuid(region, record.puuid)
    profile = await riot_fetch.fetch_profile(region, record.puuid, league=league)
    await sync_recent_matches(region, record.puuid)

    updated = build_summoner_record(region, account, profile)
    await summoner_store.upsert_summoner(updated)
    return await build_detail(updated), updated.puuid


def _stored_total_games(record: SummonerRecord) -> int:
    """保存済みのソロ + フレックスの勝敗数の合計。"""
    return record.solo_wins + record.solo_losses + record.flex_wins + record.flex_losses


async def _touch_only(
    record: SummonerRecord,
) -> tuple[SummonerDetail, str | None]:
    """新しい試合がない場合: last_updated_at だけを更新し、保存済みのデータで応答する。

    プロフィールアイコン・RiotId の変更は反映されない。
    Backfill が未完了のときだけ、Backfill 用の PUUID を返す。
    """
    now = datetime.now(timezone.utc)
    await summoner_store.update_last_updated_at(record.puuid, record.region, now)
    touched = record.model_copy(update={"last_updated_at": now})
    backfill_puuid = None if record.backfill_completed else record.puuid
    return await build_detail(touched), backfill_puuid
