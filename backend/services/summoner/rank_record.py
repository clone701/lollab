"""ランクの記録: 取得した league entries を summoner_rank_snapshots に記録する。"""

import logging
from datetime import datetime, timezone

from adapters import rank_snapshot_store
from schemas.riot_fetch import LeagueInfo
from schemas.summoner_store import RankSnapshotRecord
from services.summoner.league import FLEX_QUEUE, SOLO_QUEUE

logger = logging.getLogger(__name__)

# 取得元（将来クローラーが加わる場合は別の値にする）
SOURCE_SUMMONER_UPDATE = "summoner_update"

_UNRANKED = "UNRANKED"


def _snapshots(
    region: str, puuid: str, league: LeagueInfo, fetched_at: datetime
) -> list[RankSnapshotRecord]:
    """ソロ・フレックスの記録候補を作る（エントリのない UNRANKED のキューは除く）。"""
    solo, common = league.solo, {"puuid": puuid, "region": region}
    candidates = [
        (SOLO_QUEUE, solo.tier, solo.rank, solo.leaguePoints, solo.wins, solo.losses),
        (
            FLEX_QUEUE,
            league.flex_tier,
            league.flex_rank,
            league.flex_lp,
            league.flex_wins,
            league.flex_losses,
        ),
    ]
    return [
        RankSnapshotRecord(
            queue_type=queue,
            tier=tier,
            rank=rank,
            league_points=lp,
            wins=wins,
            losses=losses,
            fetched_at=fetched_at,
            source=SOURCE_SUMMONER_UPDATE,
            **common,
        )
        for queue, tier, rank, lp, wins, losses in candidates
        if tier != _UNRANKED
    ]


def _same_rank(a: RankSnapshotRecord, b: RankSnapshotRecord) -> bool:
    return (a.tier, a.rank, a.league_points, a.wins, a.losses) == (
        b.tier,
        b.rank,
        b.league_points,
        b.wins,
        b.losses,
    )


async def record_rank_snapshots(region: str, puuid: str, league: LeagueInfo) -> None:
    """ソロ・フレックスのランクを記録する。直前の記録と同じなら記録しない。

    記録は付随的な処理のため、失敗してもログに記録するだけで例外は送出しない
    （検索・更新を失敗させない）。
    """
    try:
        now = datetime.now(timezone.utc)
        for snapshot in _snapshots(region, puuid, league, now):
            latest = await rank_snapshot_store.get_latest_snapshot(
                puuid, snapshot.queue_type
            )
            if latest is None or not _same_rank(latest, snapshot):
                await rank_snapshot_store.insert_snapshot(snapshot)
    except Exception:
        logger.error("ランクの記録に失敗しました: puuid=%s", puuid, exc_info=True)
