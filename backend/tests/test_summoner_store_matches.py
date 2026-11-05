"""adapters/summoner_store.py のユニットテスト: matches と match_participants。

_Requirements: 4.1, 4.2, 11.2_
"""

import asyncio
from datetime import datetime, timezone

import pytest
from postgrest.types import ReturnMethod

from schemas.summoner_store import MatchRecord
from tests.store_helpers import (
    NOW,
    FakeClient,
    participant,
    participation_row,
    store,
    use,
)

# ---------------------------------------------------------------------------
# matches / match_participants
# ---------------------------------------------------------------------------


def test_filter_unsaved_match_ids_keeps_input_order(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """参加者行がある ID は除外し、残りを入力順で返す（1試合10行返っても重複は問題ない）。"""
    client = FakeClient([{"match_id": "JP1_2"}] * 10)
    use(monkeypatch, client)

    result = asyncio.run(store.filter_unsaved_match_ids(["JP1_3", "JP1_2", "JP1_1"]))

    assert result == ["JP1_3", "JP1_1"]
    name, query = client.queries[0]
    assert name == "match_participants"
    assert query.call("in_") == (
        ("match_id", ["JP1_3", "JP1_2", "JP1_1"]),
        {},
    )


def test_filter_unsaved_match_ids_treats_matches_only_as_unsaved(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """matches だけ保存され参加者がない ID は未保存扱いにする（matches は引かない）。"""
    client = FakeClient([])
    use(monkeypatch, client)

    result = asyncio.run(store.filter_unsaved_match_ids(["JP1_1"]))

    assert result == ["JP1_1"]
    assert [name for name, _ in client.queries] == ["match_participants"]


def test_filter_unsaved_match_ids_splits_queries_by_50(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """51件以上は50件ずつに分けて問い合わせ、全チャンクの結果を合わせて判定する。"""
    ids = [f"JP1_{i}" for i in range(120)]
    client = FakeClient([{"match_id": "JP1_0"}], [], [{"match_id": "JP1_119"}])
    use(monkeypatch, client)

    result = asyncio.run(store.filter_unsaved_match_ids(ids))

    assert [len(q.call("in_")[0][1]) for _, q in client.queries] == [50, 50, 20]
    assert result == ids[1:119]


def test_filter_unsaved_match_ids_empty_makes_no_query(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = FakeClient()
    use(monkeypatch, client)

    assert asyncio.run(store.filter_unsaved_match_ids([])) == []
    assert client.queries == []


def test_get_match_end_times_returns_saved_matches_only(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """matches にある試合だけ {match_id: game_end_at} で返す。100件ずつ問い合わせる。"""
    ids = [f"JP1_{i}" for i in range(130)]
    client = FakeClient(
        [{"match_id": "JP1_0", "game_end_at": "2025-03-01T12:00:00+00:00"}],
        [{"match_id": "JP1_129", "game_end_at": "2025-03-01T11:00:00.5Z"}],
    )
    use(monkeypatch, client)

    result = asyncio.run(store.get_match_end_times(ids))

    assert result == {
        "JP1_0": NOW,
        "JP1_129": datetime(2025, 3, 1, 11, 0, 0, 500000, tzinfo=timezone.utc),
    }
    assert [name for name, _ in client.queries] == ["matches", "matches"]
    assert [len(q.call("in_")[0][1]) for _, q in client.queries] == [100, 30]


def test_get_match_end_times_empty_makes_no_query(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = FakeClient()
    use(monkeypatch, client)

    assert asyncio.run(store.get_match_end_times([])) == {}
    assert client.queries == []


def test_save_matches_upserts_matches_before_participants(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """matches を先に upsert し（外部キーのため）、主キー衝突時は上書きする。"""
    client = FakeClient()
    use(monkeypatch, client)
    match = MatchRecord(
        match_id="JP1_1",
        queue_id=420,
        game_mode="CLASSIC",
        game_version="15.10.1",
        game_duration=1800,
        game_end_at=NOW,
    )

    asyncio.run(store.save_matches([match], [participant("JP1_1")]))

    assert [name for name, _ in client.queries] == ["matches", "match_participants"]
    match_args, match_kwargs = client.queries[0][1].call("upsert")
    assert match_args[0][0]["match_id"] == "JP1_1"
    assert "created_at" not in match_args[0][0]
    assert match_kwargs["on_conflict"] == "match_id"
    assert match_kwargs["returning"] == ReturnMethod.minimal
    part_args, part_kwargs = client.queries[1][1].call("upsert")
    assert part_args[0][0]["item_ids"] == [1, 2, 3, 4, 5, 6, 7]
    assert part_kwargs["on_conflict"] == "match_id,puuid"


def test_save_matches_empty_makes_no_query(monkeypatch: pytest.MonkeyPatch) -> None:
    client = FakeClient()
    use(monkeypatch, client)

    asyncio.run(store.save_matches([], []))

    assert client.queries == []


def test_get_recent_participations_flattens_embedded_match(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = FakeClient([participation_row(1)])
    use(monkeypatch, client)

    result = asyncio.run(store.get_recent_participations("puuid-0", 20))

    assert result[0].match_id == "JP1_1"
    assert result[0].game_mode == "CLASSIC"
    assert result[0].game_duration == 1800
    query = client.queries[0][1]
    assert query.call("eq") == (("puuid", "puuid-0"), {})
    assert query.call("order") == (("game_end_at",), {"desc": True})
    assert query.call("limit") == ((20,), {})


def test_get_participations_between_applies_period(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """start 以上・end 未満で絞る。"""
    client = FakeClient([])
    use(monkeypatch, client)
    start = datetime(2025, 1, 1, tzinfo=timezone.utc)
    end = datetime(2025, 2, 1, tzinfo=timezone.utc)

    asyncio.run(store.get_participations_between("puuid-0", start, end))

    query = client.queries[0][1]
    assert query.call("gte") == (("game_end_at", start.isoformat()), {})
    assert query.call("lt") == (("game_end_at", end.isoformat()), {})


def test_get_participations_between_all_time_has_no_period_filter(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = FakeClient([])
    use(monkeypatch, client)

    asyncio.run(store.get_participations_between("puuid-0", None, None))

    names = client.queries[0][1].names()
    assert "gte" not in names and "lt" not in names


def test_get_participations_between_reads_all_pages(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """1ページの上限（1000行）に達したら、次のページも取得する。"""
    page1 = [participation_row(i) for i in range(1000)]
    page2 = [participation_row(i) for i in range(1000, 1003)]
    client = FakeClient(page1, page2)
    use(monkeypatch, client)

    result = asyncio.run(store.get_participations_between("puuid-0", None, None))

    assert len(result) == 1003
    assert [q.call("range")[0] for _, q in client.queries] == [
        (0, 999),
        (1000, 1999),
    ]
