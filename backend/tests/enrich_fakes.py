"""補完フェーズ・ランクの記録のテスト用: FakeStore に足す代役のメソッド。"""

from datetime import datetime

from schemas.summoner_store import EnrichTarget, MatchRecord, RankSnapshotRecord


class EnrichFakes:
    """enrich_store / rank_snapshot_store の代役（FakeStore に継承させる）。

    targets は補完が必要な試合。save_matches で保存されると、取り込み済みの項目に
    応じて needs_detail / needs_timeline が下がり、両方 False になると対象から外れる。
    """

    def __init__(self) -> None:
        self.targets: dict[str, EnrichTarget] = {}
        self.target_queries: list[tuple[datetime | None, int]] = []
        self.snapshots: list[RankSnapshotRecord] = []

    def add_target(
        self,
        match_id: str,
        game_end_at: datetime,
        needs_detail: bool = True,
        needs_timeline: bool = True,
    ) -> None:
        self.targets[match_id] = EnrichTarget(
            match_id=match_id,
            game_end_at=game_end_at,
            needs_detail=needs_detail,
            needs_timeline=needs_timeline,
        )

    def apply_saved(self, matches: list[MatchRecord]) -> None:
        """save_matches の内容を補完対象に反映する。"""
        for m in matches:
            target = self.targets.get(m.match_id)
            if target is None:
                continue
            needs_detail = target.needs_detail and m.detail_version < 2
            needs_timeline = target.needs_timeline and m.timeline_fetched_at is None
            if needs_detail or needs_timeline:
                self.targets[m.match_id] = target.model_copy(
                    update={
                        "needs_detail": needs_detail,
                        "needs_timeline": needs_timeline,
                    }
                )
            else:
                del self.targets[m.match_id]

    async def get_enrichment_targets(
        self, after: datetime | None, limit: int
    ) -> list[EnrichTarget]:
        self.target_queries.append((after, limit))
        found = sorted(
            (
                t
                for t in self.targets.values()
                if after is None or t.game_end_at >= after
            ),
            key=lambda t: (t.game_end_at, t.match_id),
        )
        return found[:limit]

    async def get_latest_snapshot(
        self, puuid: str, queue_type: str
    ) -> RankSnapshotRecord | None:
        found = [
            s for s in self.snapshots if s.puuid == puuid and s.queue_type == queue_type
        ]
        # 同じ日時（時計の分解能）の場合は、後から追加した記録を直近とする
        return max(reversed(found), key=lambda s: s.fetched_at) if found else None

    async def insert_snapshot(self, record: RankSnapshotRecord) -> None:
        self.snapshots.append(record)
