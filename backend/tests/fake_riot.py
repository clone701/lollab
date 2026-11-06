"""search / update / backfill のテスト用: Riot API 取得（riot_fetch）の代役。"""

from datetime import datetime, timedelta, timezone
from typing import Any

from schemas.riot_fetch import (
    AccountInfo,
    FailedFetch,
    FetchedMatch,
    LeagueInfo,
    MatchDetailsResult,
    ProfileInfo,
)
from schemas.summoner import RankData
from schemas.summoner_store import MatchRecord
from services.summoner.riot_fetch import RiotRateLimitError
from tests.riot_fetch_helpers import status_error
from tests.store_helpers import participant

BASE_TIME = datetime(2025, 3, 1, tzinfo=timezone.utc)
PUUID = "puuid-0"


def match_time(index: int) -> datetime:
    """履歴の index 番目（0 が最新）の試合終了日時。1時間ごとに古くなる。"""
    return BASE_TIME - timedelta(hours=index)


def make_history(count: int) -> list[tuple[str, datetime]]:
    """新しい順に count 件の試合履歴を作る（JP1_0 が最新）。"""
    return [(f"JP1_{i}", match_time(i)) for i in range(count)]


class FakeRiot:
    """Riot API 取得（riot_fetch）の代役。

    history は新しい順の (match_id, 終了日時)。試合ID一覧は本物と同様に
    start / count / start_time / end_time（どちらも境界を含む）で絞り込む。
    """

    def __init__(
        self,
        history: list[tuple[str, datetime]] | None = None,
        rate_limit_after: int | None = None,
        fail_ids: set[str] | None = None,
        timeline_fail_ids: set[str] | None = None,
        extra_times: dict[str, datetime] | None = None,
    ) -> None:
        self.history = history or []
        # 試合ID一覧には出ないが、詳細は取得できる試合（補完対象）の終了日時
        self.extra_times = dict(extra_times or {})
        self.rate_limit_after = rate_limit_after
        # 取得に失敗（429 以外）させる試合ID。テスト中に書き換えられる
        self.fail_ids: set[str] = set(fail_ids or ())
        # 詳細は取得できるがタイムラインの取得に失敗（429 以外）させる試合ID
        self.timeline_fail_ids: set[str] = set(timeline_fail_ids or ())
        self.timeline_only_calls: list[frozenset[str]] = []
        self.league = LeagueInfo(
            solo=RankData(
                queueType="RANKED_SOLO_5x5",
                tier="GOLD",
                rank="I",
                leaguePoints=77,
                wins=20,
                losses=10,
            ),
            flex_wins=3,
            flex_losses=2,
        )
        self.league_error: Exception | None = None
        self.account = AccountInfo(puuid=PUUID, game_name="TestUser", tag_line="JP1")
        self.account_error: Exception | None = None
        self.profile_error: Exception | None = None
        self.ids_error: Exception | None = None
        self.calls: list[str] = []
        self.id_calls: list[dict[str, Any]] = []
        self.detail_calls: list[list[str]] = []
        self.detail_priorities: list[str] = []
        self.archives: list[Any] = []
        self.served = 0

    async def fetch_account_by_riot_id(self, *args: Any) -> AccountInfo:
        self.calls.append("account_by_riot_id")
        if self.account_error:
            raise self.account_error
        return self.account

    async def fetch_account_by_puuid(self, *args: Any) -> AccountInfo:
        self.calls.append("account_by_puuid")
        if self.account_error:
            raise self.account_error
        return self.account

    async def fetch_league(self, *args: Any) -> LeagueInfo:
        self.calls.append("league")
        if self.league_error:
            raise self.league_error
        return self.league

    async def fetch_profile(
        self, *args: Any, league: LeagueInfo | None = None
    ) -> ProfileInfo:
        """league を渡された場合は league-v4 を呼ばない（calls に "league" を足さない）。"""
        self.calls.append("profile")
        if self.profile_error:
            raise self.profile_error
        if league is None:
            league = await self.fetch_league()
        return ProfileInfo(
            level=123,
            profile_icon_id=9,
            rank=league.solo,
            flex_wins=league.flex_wins,
            flex_losses=league.flex_losses,
        )

    async def fetch_ranked_match_ids(
        self,
        region: str,
        puuid: str,
        *,
        start: int,
        count: int,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
        priority: str = "interactive",
        queue: int | None = None,
    ) -> list[str]:
        self.calls.append("match_ids")
        self.id_calls.append(
            {
                "start": start,
                "count": count,
                "start_time": start_time,
                "end_time": end_time,
                "priority": priority,
                "queue": queue,
            }
        )
        if self.ids_error:
            raise self.ids_error
        ids = [
            m
            for m, t in self.history
            if (start_time is None or t >= start_time)
            and (end_time is None or t <= end_time)
        ]
        return ids[start : start + count]

    async def fetch_match_details(
        self,
        region: str,
        match_ids: list[str],
        priority: str = "interactive",
        timeline_only_ids: frozenset[str] = frozenset(),
        archive: Any = None,
    ) -> MatchDetailsResult:
        self.calls.append("match_details")
        self.archives.append(archive)
        self.detail_calls.append(list(match_ids))
        self.timeline_only_calls.append(timeline_only_ids)
        self.detail_priorities.append(priority)
        times = {**self.extra_times, **dict(self.history)}
        fetched: list[FetchedMatch] = []
        failures: list[FailedFetch] = []
        for match_id in match_ids:
            if match_id in self.fail_ids:
                failures.append(FailedFetch(match_id=match_id, error="HTTP 500"))
                continue
            if (
                self.rate_limit_after is not None
                and self.served >= self.rate_limit_after
            ):
                error = RiotRateLimitError(status_error(429))
                error.fetched = fetched
                error.failures = failures
                raise error
            match = MatchRecord(
                match_id=match_id,
                queue_id=420,
                game_mode="CLASSIC",
                game_version="15.10.1",
                game_duration=1800,
                game_end_at=times[match_id],
                detail_version=2,
            )
            timeline_failed = match_id in self.timeline_fail_ids
            if not timeline_failed:
                match = match.model_copy(update={"timeline_fetched_at": BASE_TIME})
            fetched.append(
                FetchedMatch(
                    match=match,
                    participants=[participant(match_id)],
                    timeline_error="HTTP 500" if timeline_failed else None,
                )
            )
            self.served += 1
            if archive is not None:
                await archive.save_detail(match_id, {"matchId": match_id})
                await archive.save_timeline(match_id, {"matchId": match_id})
        return MatchDetailsResult(fetched=fetched, failures=failures)

    @property
    def requested_details(self) -> list[str]:
        """fetch_match_details に渡された ID を呼び出し順に連結したもの。"""
        return [m for call in self.detail_calls for m in call]
