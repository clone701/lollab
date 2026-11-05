"""ストア層のテスト: ビルド用の追加項目（match_bans・タイムライン由来の列）・補完対象・ランクの記録。

このファイルは load_store で adapters/ のモジュールを読み込むため、
test_router_properties.py（sys.modules["adapters"] を差し替える）より前に
収集されるファイル名にしている。

_Requirements: 4.5, 4.7, 4.9_
"""

import asyncio
from datetime import datetime, timezone

import pytest

from schemas.summoner_store import (
    BanRecord,
    MatchRecord,
    ParticipantRecord,
    RankSnapshotRecord,
)
from tests.store_helpers import NOW, FakeClient, load_store, participant, store, use

enrich_store = load_store("enrich_store.py")
rank_store = load_store("rank_snapshot_store.py")

NOW_TEXT = "2025-03-01T12:00:00Z"


def _match(match_id: str, timeline: bool) -> MatchRecord:
    return MatchRecord(
        match_id=match_id,
        queue_id=420,
        game_mode="CLASSIC",
        game_version="15.10.1",
        game_duration=1800,
        game_end_at=NOW,
        patch="15.10",
        detail_version=2,
        timeline_fetched_at=NOW if timeline else None,
    )


def _timeline_participant(match_id: str) -> ParticipantRecord:
    return participant(match_id).model_copy(
        update={
            "skill_order": [1, 2],
            "starting_items": [1055],
            "completed_items": [3157],
        }
    )


def _first_row(client: FakeClient, index: int) -> dict[str, object]:
    """index 番目のクエリの upsert の先頭行。"""
    row: dict[str, object] = client.queries[index][1].call("upsert")[0][0][0]
    return row


def test_save_matches_upserts_bans_after_matches(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = FakeClient()
    use(monkeypatch, client)
    bans = [BanRecord(match_id="JP1_1", team_id=100, pick_turn=1, champion_id=11)]

    asyncio.run(
        store.save_matches([_match("JP1_1", False)], [participant("JP1_1")], bans)
    )

    assert [name for name, _ in client.queries] == [
        "matches",
        "match_participants",
        "match_bans",
    ]
    args, kwargs = client.queries[2][1].call("upsert")
    assert args[0] == [
        {"match_id": "JP1_1", "team_id": 100, "pick_turn": 1, "champion_id": 11}
    ]
    assert kwargs["on_conflict"] == "match_id,team_id,pick_turn"


def test_save_matches_without_timeline_does_not_write_timeline_columns(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """タイムラインのない試合は、タイムライン由来の列を書き込まない（NULL で上書きしない）。"""
    client = FakeClient()
    use(monkeypatch, client)

    asyncio.run(store.save_matches([_match("JP1_1", False)], [participant("JP1_1")]))

    match_row, part_row = _first_row(client, 0), _first_row(client, 1)
    assert "timeline_fetched_at" not in match_row
    assert match_row["detail_version"] == 2 and match_row["patch"] == "15.10"
    assert not {"skill_order", "starting_items", "completed_items"} & set(part_row)
    assert part_row["is_remake"] is False


def test_save_matches_with_timeline_writes_timeline_columns(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = FakeClient()
    use(monkeypatch, client)

    asyncio.run(
        store.save_matches([_match("JP1_1", True)], [_timeline_participant("JP1_1")])
    )

    match_row, part_row = _first_row(client, 0), _first_row(client, 1)
    assert match_row["timeline_fetched_at"] == NOW_TEXT
    assert part_row["skill_order"] == [1, 2]
    assert part_row["starting_items"] == [1055]
    assert part_row["completed_items"] == [3157]


def test_save_matches_splits_rows_with_and_without_timeline(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """一括 upsert は列を揃える必要があるため、タイムラインの有無でグループを分ける。"""
    client = FakeClient()
    use(monkeypatch, client)
    matches = [_match("JP1_1", True), _match("JP1_2", False)]
    parts = [_timeline_participant("JP1_1"), participant("JP1_2")]

    asyncio.run(store.save_matches(matches, parts))

    assert [name for name, _ in client.queries] == [
        "matches",
        "matches",
        "match_participants",
        "match_participants",
    ]
    assert [_first_row(client, i)["match_id"] for i in range(4)] == [
        "JP1_1",
        "JP1_2",
        "JP1_1",
        "JP1_2",
    ]


def test_get_enrichment_targets_queries_outdated_or_missing_timeline(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """detail_version < 2 または timeline_fetched_at IS NULL を、古い順に取得する。"""
    client = FakeClient(
        [
            {
                "match_id": "JP1_1",
                "game_end_at": "2025-03-01T12:00:00+00:00",
                "detail_version": 1,
                "timeline_fetched_at": None,
            },
            {
                "match_id": "JP1_2",
                "game_end_at": "2025-03-01T13:00:00+00:00",
                "detail_version": 2,
                "timeline_fetched_at": None,
            },
            {
                "match_id": "JP1_3",
                "game_end_at": "2025-03-01T14:00:00+00:00",
                "detail_version": 1,
                "timeline_fetched_at": "2025-03-02T00:00:00+00:00",
            },
        ]
    )
    monkeypatch.setattr(enrich_store, "supabase", client)
    after = datetime(2025, 3, 1, tzinfo=timezone.utc)

    targets = asyncio.run(enrich_store.get_enrichment_targets(after, 50))

    name, query = client.queries[0]
    assert name == "matches"
    assert query.call("or_")[0] == ("detail_version.lt.2,timeline_fetched_at.is.null",)
    assert query.call("gte")[0] == ("game_end_at", after.isoformat())
    assert query.call("limit")[0] == (50,)
    assert query.names().count("order") == 2  # game_end_at, match_id の古い順
    assert [(t.match_id, t.needs_detail, t.needs_timeline) for t in targets] == [
        ("JP1_1", True, True),
        ("JP1_2", False, True),
        ("JP1_3", True, False),
    ]
    assert targets[0].game_end_at == NOW


def test_get_enrichment_targets_without_after_has_no_lower_bound(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = FakeClient([])
    monkeypatch.setattr(enrich_store, "supabase", client)

    assert asyncio.run(enrich_store.get_enrichment_targets(None, 10)) == []
    assert "gte" not in client.queries[0][1].names()


def _snapshot(**overrides: object) -> RankSnapshotRecord:
    fields: dict[str, object] = {
        "puuid": "puuid-0",
        "queue_type": "RANKED_SOLO_5x5",
        "fetched_at": NOW,
        "region": "JP",
        "tier": "GOLD",
        "rank": "II",
        "league_points": 50,
        "wins": 10,
        "losses": 5,
        "source": "summoner_update",
    }
    fields.update(overrides)
    return RankSnapshotRecord.model_validate(fields)


def test_rank_snapshot_get_latest_and_insert(monkeypatch: pytest.MonkeyPatch) -> None:
    row = _snapshot().model_dump(mode="json")
    client = FakeClient([row], [])
    monkeypatch.setattr(rank_store, "supabase", client)

    latest = asyncio.run(rank_store.get_latest_snapshot("puuid-0", "RANKED_SOLO_5x5"))
    asyncio.run(rank_store.insert_snapshot(_snapshot(wins=11)))

    assert latest == _snapshot()
    assert client.queries[0][1].call("order") == (("fetched_at",), {"desc": True})
    assert client.queries[1][0] == "summoner_rank_snapshots"
    inserted = client.queries[1][1].call("insert")[0][0]
    assert inserted["wins"] == 11 and inserted["source"] == "summoner_update"


def test_rank_snapshot_get_latest_returns_none_when_empty(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(rank_store, "supabase", FakeClient([]))

    assert asyncio.run(rank_store.get_latest_snapshot("p", "RANKED_SOLO_5x5")) is None
