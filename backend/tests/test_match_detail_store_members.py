"""adapters/match_member_store.py のユニットテスト: 試合カードの参加者の読み出し。

test_match_detail_store.py と同じ理由で、load_store を使うファイルは
test_router_properties.py より前に収集される名前にしている。
"""

import asyncio

import pytest

from tests.store_helpers import FakeClient, load_store

member_store = load_store("match_member_store.py")


def _row(match_id: str, puuid: str) -> dict[str, object]:
    return {
        "match_id": match_id,
        "puuid": puuid,
        "riot_id_game_name": None,
        "riot_id_tagline": None,
        "team_id": 100,
        "team_position": "TOP",
        "champion_name": "Ahri",
        "kills": 3,
    }


def _use(monkeypatch: pytest.MonkeyPatch, client: FakeClient) -> None:
    monkeypatch.setattr(member_store, "supabase", client)


def test_groups_members_by_match(monkeypatch: pytest.MonkeyPatch) -> None:
    client = FakeClient([_row("JP1_1", "a"), _row("JP1_2", "a"), _row("JP1_1", "b")])
    _use(monkeypatch, client)

    result = asyncio.run(member_store.get_members_by_match(["JP1_1", "JP1_2", "JP1_3"]))

    assert {k: [m.puuid for m in v] for k, v in result.items()} == {
        "JP1_1": ["a", "b"],
        "JP1_2": ["a"],
    }
    assert [name for name, _ in client.queries] == ["match_participants"]
    query = client.queries[0][1]
    assert query.call("in_")[0] == ("match_id", ["JP1_1", "JP1_2", "JP1_3"])
    selected = query.call("select")[0][0]
    assert "kills" in selected and "item_ids" not in selected


def test_splits_queries_by_50_matches(monkeypatch: pytest.MonkeyPatch) -> None:
    """1試合10行のため、1回の問い合わせを50試合（500行）までにして上限1000行を超えない。"""
    ids = [f"JP1_{i}" for i in range(120)]
    client = FakeClient([_row("JP1_0", "a")], [], [_row("JP1_119", "b")])
    _use(monkeypatch, client)

    result = asyncio.run(member_store.get_members_by_match(ids))

    assert [len(q.call("in_")[0][1]) for _, q in client.queries] == [50, 50, 20]
    assert set(result) == {"JP1_0", "JP1_119"}


def test_empty_makes_no_query(monkeypatch: pytest.MonkeyPatch) -> None:
    client = FakeClient()
    _use(monkeypatch, client)

    assert asyncio.run(member_store.get_members_by_match([])) == {}
    assert client.queries == []
