"""チャンピオンビルドの集計: 絞り込み条件の決定とデータ取得、応答の組み立て。"""

import asyncio
from datetime import datetime, timedelta, timezone

from adapters import champion_stats_store
from schemas.champion import (
    ChampionBuildResponse,
    ChampionBuildSummary,
    Period,
    QueueFilter,
)
from schemas.champion_store import BuildRow, StatsFilter
from services.champion.build_elements import build_elements

# キューの絞り込み → queue_id（420 = ソロ/デュオ、440 = フレックス）
_QUEUE_IDS: dict[str, list[int]] = {
    "solo": [420],
    "flex": [440],
    "all": [420, 440],
}

# 「直近30日」の日数
_RECENT_DAYS = 30


def make_filters(
    period: Period, queue: QueueFilter, latest_patch: str | None, now: datetime
) -> StatsFilter | None:
    """期間・キューから集計対象の絞り込み条件を作る。

    最新パッチを指定したのに DB に試合がない（latest_patch が None）場合は、
    条件を作れないため None を返す。条件なしにすると全期間になってしまうため。
    """
    queue_ids = _QUEUE_IDS[queue]
    if period == "latest_patch":
        if latest_patch is None:
            return None
        return StatsFilter(queue_ids=queue_ids, patch=latest_patch)
    if period == "last_30_days":
        since = now - timedelta(days=_RECENT_DAYS)
        return StatsFilter(queue_ids=queue_ids, since=since)
    return StatsFilter(queue_ids=queue_ids)


def _most_played_role(roles: dict[str, int]) -> str | None:
    """試合数が最も多いロール。同数ならロール名の昇順で先のもの。なければ None。"""
    return min(roles, key=lambda role: (-roles[role], role), default=None)


async def _get_rows(
    champion_name: str, role: str | None, filters: StatsFilter
) -> list[BuildRow]:
    if role is None:
        return []
    return await champion_stats_store.get_build_rows(champion_name, role, filters)


async def _get_role_totals(role: str | None, filters: StatsFilter) -> tuple[int, int]:
    if role is None:
        return 0, 0
    return await champion_stats_store.get_role_win_totals(role, filters)


async def _count_bans(champion_name: str, filters: StatsFilter) -> int:
    champion_id = await champion_stats_store.get_champion_id(champion_name)
    if champion_id is None:
        return 0
    return await champion_stats_store.count_bans(champion_id, filters)


def _ratio(numerator: int, denominator: int) -> float:
    return numerator / denominator if denominator > 0 else 0.0


def _summary(
    rows: list[BuildRow],
    role_totals: tuple[int, int],
    total_matches: int,
    bans: int,
) -> ChampionBuildSummary:
    games = len(rows)
    wins = sum(1 for row in rows if row.win)
    role_games, role_wins = role_totals
    delta = 0.0
    if games > 0 and role_games > 0:
        delta = _ratio(wins, games) - _ratio(role_wins, role_games)
    return ChampionBuildSummary(
        games=games,
        wins=wins,
        win_rate_delta=delta,
        pick_rate=_ratio(games, total_matches),
        ban_rate=_ratio(bans, total_matches),
    )


async def get_champion_build(
    champion_name: str, role: str | None, period: Period, queue: QueueFilter
) -> ChampionBuildResponse:
    """チャンピオンのビルド集計を返す。

    role が None の場合は、同じ期間・キューで試合数が最も多いロールを使う。
    試合が1件もなければ、roles が空・試合数0の応答を返す（role は指定がなければ None）。
    """
    latest_patch = await champion_stats_store.get_latest_patch()
    filters = make_filters(period, queue, latest_patch, datetime.now(timezone.utc))

    roles: dict[str, int] = {}
    rows: list[BuildRow] = []
    role_totals = (0, 0)
    total_matches = bans = 0
    if filters is not None:
        roles = await champion_stats_store.count_role_games(champion_name, filters)
        role = role if role is not None else _most_played_role(roles)
        rows, role_totals, total_matches, bans = await asyncio.gather(
            _get_rows(champion_name, role, filters),
            _get_role_totals(role, filters),
            champion_stats_store.count_matches(filters),
            _count_bans(champion_name, filters),
        )

    ordered_roles = dict(sorted(roles.items(), key=lambda kv: (-kv[1], kv[0])))
    return ChampionBuildResponse(
        champion_name=champion_name,
        role=role,
        roles=ordered_roles,
        period=period,
        queue=queue,
        latest_patch=latest_patch,
        summary=_summary(rows, role_totals, total_matches, bans),
        **build_elements(rows),
    )
