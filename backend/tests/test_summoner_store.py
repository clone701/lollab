"""adapters/summoner_store.py のユニットテスト: summoners と seasons（Supabase はモック）。

発行するクエリの条件と、取得結果の変換を確認する。実際の DB には接続しない。

_Requirements: 4.1, 11.2_
"""

import asyncio

import pytest

from schemas.summoner_store import BackfillState, SummonerRecord
from tests.store_helpers import NOW, FakeClient, store, summoner_row, use

# ---------------------------------------------------------------------------
# summoners
# ---------------------------------------------------------------------------


def test_find_summoner_returns_newest_row(monkeypatch: pytest.MonkeyPatch) -> None:
    """region と riot_id_lower で絞り、last_updated_at の新しい1行を取る。"""
    client = FakeClient([summoner_row()])
    use(monkeypatch, client)

    result = asyncio.run(store.find_summoner("JP", "testuser#jp1"))

    assert isinstance(result, SummonerRecord)
    assert result.puuid == "puuid-0"
    assert result.rank_top_percent == 45.5
    table, query = client.queries[0]
    assert table == "summoners"
    assert [c for c in query.calls if c[0] == "eq"] == [
        ("eq", ("region", "JP"), {}),
        ("eq", ("riot_id_lower", "testuser#jp1"), {}),
    ]
    assert query.call("order") == (("last_updated_at",), {"desc": True})
    assert query.call("limit") == ((1,), {})


def test_find_summoner_returns_none_when_not_found(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    use(monkeypatch, FakeClient([]))

    assert asyncio.run(store.find_summoner("JP", "nobody#jp1")) is None


def test_find_summoner_by_puuid(monkeypatch: pytest.MonkeyPatch) -> None:
    client = FakeClient([summoner_row()])
    use(monkeypatch, client)

    result = asyncio.run(store.find_summoner_by_puuid("puuid-0", "JP"))

    assert result is not None and result.game_name == "TestUser"
    eqs = [c[1] for c in client.queries[0][1].calls if c[0] == "eq"]
    assert eqs == [("puuid", "puuid-0"), ("region", "JP")]


def test_upsert_summoner_excludes_backfill_and_created_columns(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Backfill の状態と created_at は書き込まない。NULL の順位は書き込む。"""
    client = FakeClient()
    use(monkeypatch, client)
    record = SummonerRecord.model_validate(
        summoner_row(backfill_completed=True, synced_until="2025-02-01T00:00:00Z")
    )

    asyncio.run(store.upsert_summoner(record))

    table, query = client.queries[0]
    assert table == "summoners"
    args, kwargs = query.call("upsert")
    payload = args[0]
    assert kwargs == {"on_conflict": "puuid,region"}
    for column in (
        "synced_until",
        "backfill_cursor",
        "backfill_completed",
        "backfill_started_at",
        "created_at",
    ):
        assert column not in payload
    assert payload["puuid"] == "puuid-0"
    assert payload["rank_position"] is None
    assert payload["last_updated_at"] == "2025-03-01T12:00:00Z"


def test_upsert_summoner_writes_flex_wins_and_losses(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """flex_wins / flex_losses は書き込む列に含まれる。"""
    client = FakeClient()
    use(monkeypatch, client)
    record = SummonerRecord.model_validate(summoner_row())

    asyncio.run(store.upsert_summoner(record))

    payload = client.queries[0][1].call("upsert")[0][0]
    assert (payload["flex_wins"], payload["flex_losses"]) == (4, 3)


def test_update_last_updated_at_writes_only_that_column(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """last_updated_at だけを更新対象にし、puuid と region で行を絞る。"""
    client = FakeClient()
    use(monkeypatch, client)

    asyncio.run(store.update_last_updated_at("puuid-0", "JP", NOW))

    table, query = client.queries[0]
    assert table == "summoners"
    assert query.call("update")[0][0] == {"last_updated_at": NOW.isoformat()}
    assert [c[1] for c in query.calls if c[0] == "eq"] == [
        ("puuid", "puuid-0"),
        ("region", "JP"),
    ]


def test_update_backfill_state(monkeypatch: pytest.MonkeyPatch) -> None:
    client = FakeClient()
    use(monkeypatch, client)
    state = BackfillState(
        synced_until=NOW, backfill_cursor=None, backfill_completed=True
    )

    asyncio.run(store.update_backfill_state("puuid-0", "JP", state))

    query = client.queries[0][1]
    args, _ = query.call("update")
    assert args[0] == {
        "synced_until": "2025-03-01T12:00:00Z",
        "backfill_cursor": None,
        "backfill_completed": True,
    }
    eqs = [c[1] for c in query.calls if c[0] == "eq"]
    assert eqs == [("puuid", "puuid-0"), ("region", "JP")]


def test_try_start_backfill_true_when_row_updated(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """NULL または10分より前なら更新でき、現在時刻を書き込んで True を返す。"""
    client = FakeClient([summoner_row()])
    use(monkeypatch, client)

    assert asyncio.run(store.try_start_backfill("puuid-0", "JP")) is True

    query = client.queries[0][1]
    args, _ = query.call("update")
    assert args[0]["backfill_started_at"]
    (condition,), _ = query.call("or_")
    assert condition.startswith("backfill_started_at.is.null,backfill_started_at.lt.")


def test_try_start_backfill_false_when_started_within_10_minutes(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """10分以内に開始済みなら更新対象の行がなく、False を返す。"""
    use(monkeypatch, FakeClient([]))

    assert asyncio.run(store.try_start_backfill("puuid-0", "JP")) is False


# ---------------------------------------------------------------------------
# seasons
# ---------------------------------------------------------------------------


def test_get_current_season(monkeypatch: pytest.MonkeyPatch) -> None:
    client = FakeClient(
        [
            {
                "id": "2025-S1",
                "name": "2025 Season 1",
                "start_at": "2025-01-09T00:00:00+00:00",
                "end_at": None,
            }
        ]
    )
    use(monkeypatch, client)

    season = asyncio.run(store.get_current_season())

    assert season is not None
    assert season.id == "2025-S1"
    assert season.end_at is None
    assert client.queries[0][1].call("is_") == (("end_at", "null"), {})


def test_get_current_season_none_when_not_registered(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    use(monkeypatch, FakeClient([]))

    assert asyncio.run(store.get_current_season()) is None
