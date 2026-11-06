"""試合詳細まわりのストア層のテスト: raw_bundle_key の保存・読み出し、参加者のランク。

このファイルは load_store で adapters/ のモジュールを読み込むため、
test_router_properties.py（sys.modules["adapters"] を差し替える）より前に
収集されるファイル名にしている。

_Requirements: 2.8, 4.1, 4.4
"""

import asyncio
from typing import Any

import pytest

from schemas.match_detail import RankBrief
from schemas.summoner_store import MatchRecord
from tests.store_helpers import NOW, FakeClient, load_store, participant, store, use

match_store = load_store("match_store.py")
rank_store = load_store("match_rank_store.py")


def _match(match_id: str, bundle_key: str | None) -> MatchRecord:
    return MatchRecord(
        match_id=match_id,
        queue_id=420,
        game_mode="CLASSIC",
        game_version="15.10.1",
        game_duration=1800,
        game_end_at=NOW,
        raw_bundle_key=bundle_key,
    )


# --- raw_bundle_key の保存（None は書き込まない） ---


def test_save_matches_writes_raw_bundle_key(monkeypatch: pytest.MonkeyPatch) -> None:
    client = FakeClient()
    use(monkeypatch, client)

    asyncio.run(
        store.save_matches([_match("JP1_1", "bundles/a.jsonl.gz")], [participant()])
    )

    rows = client.queries[0][1].call("upsert")[0][0]
    assert rows[0]["raw_bundle_key"] == "bundles/a.jsonl.gz"


def test_save_matches_omits_raw_bundle_key_when_none(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """検索・Backfill の試合は、既存のキーを NULL で上書きしない。"""
    client = FakeClient()
    use(monkeypatch, client)

    asyncio.run(store.save_matches([_match("JP1_1", None)], [participant()]))

    assert "raw_bundle_key" not in client.queries[0][1].call("upsert")[0][0][0]


def test_save_matches_splits_groups_by_raw_bundle_key(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = FakeClient()
    use(monkeypatch, client)

    asyncio.run(
        store.save_matches(
            [_match("JP1_1", None), _match("JP1_2", "bundles/a.jsonl.gz")],
            [participant("JP1_1"), participant("JP1_2")],
        )
    )

    # 列の多いグループ（キーあり）が先
    upserts = [query.call("upsert")[0][0] for _, query in client.queries[:2]]
    assert [[r["match_id"] for r in rows] for rows in upserts] == [
        ["JP1_2"],
        ["JP1_1"],
    ]


# --- get_raw_bundle_key ---


def _bundle_key(monkeypatch: pytest.MonkeyPatch, rows: list[dict[str, Any]]) -> Any:
    client = FakeClient(rows)
    monkeypatch.setattr(match_store, "supabase", client)
    result = asyncio.run(match_store.get_raw_bundle_key("JP1_1"))
    query = client.queries[0][1]
    assert client.queries[0][0] == "matches"
    assert query.call("eq")[0] == ("match_id", "JP1_1")
    return result


def test_get_raw_bundle_key_returns_key(monkeypatch: pytest.MonkeyPatch) -> None:
    assert _bundle_key(monkeypatch, [{"raw_bundle_key": "bundles/a"}]) == (
        True,
        "bundles/a",
    )


def test_get_raw_bundle_key_distinguishes_no_key_from_no_match(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    assert _bundle_key(monkeypatch, [{"raw_bundle_key": None}]) == (True, None)
    assert _bundle_key(monkeypatch, []) == (False, None)


# --- get_ranks ---


def _ranks(
    monkeypatch: pytest.MonkeyPatch,
    summoners: list[dict[str, Any]],
    seeds: list[dict[str, Any]],
    puuids: list[str],
) -> tuple[dict[str, RankBrief], FakeClient]:
    client = FakeClient(summoners, seeds)
    monkeypatch.setattr(rank_store, "supabase", client)
    return asyncio.run(rank_store.get_ranks(puuids)), client


def test_summoners_take_priority_over_crawler_seeds(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    ranks, client = _ranks(
        monkeypatch,
        [{"puuid": "a", "solo_tier": "EMERALD", "solo_rank": "II"}],
        [
            {"puuid": "a", "tier": "DIAMOND", "division": "I"},
            {"puuid": "b", "tier": "MASTER", "division": None},
        ],
        ["a", "b", "c"],
    )

    assert ranks == {
        "a": RankBrief(tier="EMERALD", division="II"),
        "b": RankBrief(tier="MASTER", division=None),
    }
    assert [name for name, _ in client.queries] == ["summoners", "crawler_seeds"]
    # 収集元の問い合わせは、summoners にないものだけ
    assert client.queries[1][1].call("in_")[0] == ("puuid", ["b", "c"])


def test_seeds_are_not_queried_when_summoners_cover_everyone(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    ranks, client = _ranks(
        monkeypatch,
        [{"puuid": "a", "solo_tier": "GOLD", "solo_rank": "IV"}],
        [],
        ["a"],
    )

    assert set(ranks) == {"a"}
    assert [name for name, _ in client.queries] == ["summoners"]


@pytest.mark.parametrize("tier", [None, "", "UNRANKED"])
def test_summoner_without_tier_falls_back_to_seed(
    monkeypatch: pytest.MonkeyPatch, tier: str | None
) -> None:
    ranks, _ = _ranks(
        monkeypatch,
        [{"puuid": "a", "solo_tier": tier, "solo_rank": ""}],
        [{"puuid": "a", "tier": "DIAMOND", "division": "III"}],
        ["a"],
    )

    assert ranks == {"a": RankBrief(tier="DIAMOND", division="III")}


def test_player_in_neither_table_is_omitted(monkeypatch: pytest.MonkeyPatch) -> None:
    ranks, _ = _ranks(
        monkeypatch,
        [{"puuid": "a", "solo_tier": "", "solo_rank": ""}],
        [],
        ["a"],
    )

    assert ranks == {}


def test_apex_tier_has_no_division_and_empty_rank_is_none(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    ranks, _ = _ranks(
        monkeypatch,
        [
            {"puuid": "a", "solo_tier": "CHALLENGER", "solo_rank": "I"},
            {"puuid": "b", "solo_tier": "GOLD", "solo_rank": ""},
        ],
        [],
        ["a", "b"],
    )

    assert ranks["a"] == RankBrief(tier="CHALLENGER", division=None)
    assert ranks["b"] == RankBrief(tier="GOLD", division=None)


def test_no_puuids_runs_no_query(monkeypatch: pytest.MonkeyPatch) -> None:
    ranks, client = _ranks(monkeypatch, [], [], [])

    assert ranks == {} and client.queries == []
