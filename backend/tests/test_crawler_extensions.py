"""クローラー向けの既存処理の拡張のテスト: archive・queue・rank_tier。

_Requirements: 1.4, 2.2, 4.5_
"""

import asyncio
from typing import Any
from unittest.mock import AsyncMock, patch

import pytest

from adapters import raw_store
from schemas.summoner_store import MatchRecord
from services.summoner.riot_fetch import fetch_match_details, fetch_ranked_match_ids
from tests.riot_fetch_helpers import (
    GET,
    is_timeline_path,
    match_detail,
    match_id_of,
    timeline_detail,
)
from tests.store_helpers import NOW, FakeClient, participant, store, use


class RecordingArchive:
    """保管先の代役: 受け取った生データを記録する。"""

    def __init__(self) -> None:
        self.saved: list[tuple[str, str]] = []

    async def save_detail(self, match_id: str, payload: dict[str, Any]) -> None:
        self.saved.append((match_id, "detail"))

    async def save_timeline(self, match_id: str, payload: dict[str, Any]) -> None:
        self.saved.append((match_id, "timeline"))


async def _fake_get(
    host: str, path: str, params: Any = None, priority: str = "interactive"
) -> Any:
    if is_timeline_path(path):
        return timeline_detail()
    return match_detail(match_id_of(path))


def test_archive_receives_raw_data_instead_of_per_match_files() -> None:
    """archive を渡すと、生データはそこに渡り、1試合1ファイルには保存しない。"""
    archive = RecordingArchive()

    with patch(GET, new=_fake_get):
        asyncio.run(fetch_match_details("JP", ["JP1_1"], archive=archive))

    assert archive.saved == [("JP1_1", "detail"), ("JP1_1", "timeline")]
    raw_store.save_detail.assert_not_awaited()  # type: ignore[attr-defined]
    raw_store.save_timeline.assert_not_awaited()  # type: ignore[attr-defined]


def test_default_archive_saves_per_match_files() -> None:
    """archive が None なら、これまでどおり1試合1ファイルに保存する。"""
    with patch(GET, new=_fake_get):
        asyncio.run(fetch_match_details("JP", ["JP1_1"]))

    raw_store.save_detail.assert_awaited_once()  # type: ignore[attr-defined]
    raw_store.save_timeline.assert_awaited_once()  # type: ignore[attr-defined]


def test_queue_is_sent_only_when_specified() -> None:
    mock = AsyncMock(return_value=["JP1_1"])
    with patch("services.summoner.riot_fetch.get_riot", new=mock):
        asyncio.run(fetch_ranked_match_ids("JP", "p", start=0, count=20, queue=420))
        asyncio.run(fetch_ranked_match_ids("JP", "p", start=0, count=20))

    with_queue, without_queue = (call.args[2] for call in mock.await_args_list)
    assert with_queue == {"type": "ranked", "start": 0, "count": 20, "queue": 420}
    assert "queue" not in without_queue


def _match(**overrides: Any) -> MatchRecord:
    fields: dict[str, Any] = {
        "match_id": "JP1_1",
        "queue_id": 420,
        "game_mode": "CLASSIC",
        "game_version": "15.10.1",
        "game_duration": 1800,
        "game_end_at": NOW,
    }
    fields.update(overrides)
    return MatchRecord(**fields)


def _upserted(client: FakeClient) -> dict[str, list[list[dict[str, Any]]]]:
    result: dict[str, list[list[dict[str, Any]]]] = {}
    for name, query in client.queries:
        for called, args, _ in query.calls:
            if called == "upsert":
                result.setdefault(name, []).append(args[0])
    return result


def test_save_matches_omits_rank_tier_when_none(
    monkeypatch: Any,
) -> None:
    """rank_tier が None の行は、その列を書き込まない（既存の値を消さない）。"""
    client = FakeClient()
    use(monkeypatch, client)

    asyncio.run(store.save_matches([_match()], [participant("JP1_1")]))

    upserted = _upserted(client)
    assert "rank_tier" not in upserted["matches"][0][0]
    assert "rank_tier" not in upserted["match_participants"][0][0]


def test_save_matches_writes_rank_tier_when_given(monkeypatch: Any) -> None:
    client = FakeClient()
    use(monkeypatch, client)
    part = participant("JP1_1").model_copy(update={"rank_tier": "DIAMOND"})

    asyncio.run(
        store.save_matches([_match(rank_tier="DIAMOND")], [part]),
    )

    upserted = _upserted(client)
    assert upserted["matches"][0][0]["rank_tier"] == "DIAMOND"
    assert upserted["match_participants"][0][0]["rank_tier"] == "DIAMOND"


def test_save_matches_splits_groups_by_rank_tier_and_timeline(
    monkeypatch: Any,
) -> None:
    """rank_tier とタイムラインの有無が混在しても、列の揃ったグループに分ける。"""
    client = FakeClient()
    use(monkeypatch, client)
    matches = [
        _match(match_id="JP1_1", rank_tier="EMERALD", timeline_fetched_at=NOW),
        _match(match_id="JP1_2", rank_tier="EMERALD"),
        _match(match_id="JP1_3", timeline_fetched_at=NOW),
        _match(match_id="JP1_4"),
    ]

    asyncio.run(store.save_matches(matches, []))

    groups = _upserted(client)["matches"]
    keysets = [{"rank_tier", "timeline_fetched_at"} & set(g[0]) for g in groups]
    assert keysets[0] == {"rank_tier", "timeline_fetched_at"}
    assert sorted(len(g) for g in groups) == [1, 1, 1, 1]
    assert {frozenset(k) for k in keysets} == {
        frozenset({"rank_tier", "timeline_fetched_at"}),
        frozenset({"rank_tier"}),
        frozenset({"timeline_fetched_at"}),
        frozenset(),
    }
    assert all(len({frozenset(row) for row in g}) == 1 for g in groups)


def test_rate_limiter_counts_only_allowed_sends() -> None:
    """total_sent は送信を許可した回数だけ数える（上限で拒否した分は数えない）。"""
    from adapters.riot_rate_limiter import RateLimitExceeded, RiotRateLimiter

    limiter = RiotRateLimiter([(2, 100.0)], max_wait=0, backfill_reserve_ratio=0)

    async def run() -> None:
        await limiter.acquire("asia")
        await limiter.acquire("asia")
        with pytest.raises(RateLimitExceeded):
            await limiter.acquire("asia")

    asyncio.run(run())

    assert limiter.total_sent == 2
