"""update.py の変更検知のテスト: ソロ + フレックスの勝敗数の合計で更新の要否を判断する。

FakeRiot の league は ソロ 20勝10敗 + フレックス 3勝2敗（合計35）。

_Requirements: 3.2〜3.4_
"""

import asyncio
from datetime import datetime, timezone

import pytest
from fastapi import HTTPException

from tests.fake_riot import PUUID, FakeRiot, make_history, match_time
from tests.sync_helpers import (
    FakeStore,
    http_error,
    install_store_stub,
    installed,
    summoner_record,
)

install_store_stub()

from services.summoner.update import update_summoner  # noqa: E402

_OLD_UPDATED_AT = datetime(2025, 1, 1, tzinfo=timezone.utc)


def _same_total_record(**overrides: object) -> FakeStore:
    fields: dict[str, object] = {
        "solo_wins": 20,
        "solo_losses": 10,
        "flex_wins": 3,
        "flex_losses": 2,
        "last_updated_at": _OLD_UPDATED_AT,
    }
    fields.update(overrides)
    return FakeStore(record=summoner_record(**fields))


@pytest.mark.parametrize(
    "overrides",
    [
        {},
        # 内訳が違っても合計が同じなら新しい試合はないとみなす
        {"solo_wins": 21, "flex_wins": 2},
    ],
)
def test_same_total_calls_riot_api_once_and_only_touches_last_updated_at(
    overrides: dict[str, object],
) -> None:
    """合計が同じなら league entries の1回だけ呼び、last_updated_at だけ更新する。"""
    store = _same_total_record(
        synced_until=match_time(2), backfill_completed=True, **overrides
    )
    before = store.records[PUUID]
    riot = FakeRiot(history=make_history(30))

    with installed(store, riot):
        detail, _ = asyncio.run(update_summoner("JP", "TestUser", "JP1"))

    assert riot.calls == ["league"]
    assert store.upserts == [] and store.state_updates == []
    assert len(store.touches) == 1
    after = store.records[PUUID]
    assert after.model_dump(exclude={"last_updated_at"}) == before.model_dump(
        exclude={"last_updated_at"}
    )
    assert after.last_updated_at == store.touches[0] > _OLD_UPDATED_AT
    assert detail.summoner.lastUpdatedAt == store.touches[0]
    assert detail.summoner.level == before.level


def test_same_total_returns_backfill_puuid_only_when_incomplete() -> None:
    """Backfill 用の PUUID は backfill_completed が false のときだけ返す。"""
    results = []
    for completed in (False, True):
        store = _same_total_record(backfill_completed=completed)
        with installed(store, FakeRiot()):
            _, puuid = asyncio.run(update_summoner("JP", "TestUser", "JP1"))
        results.append(puuid)

    assert results == [PUUID, None]


def test_missing_flex_entry_counts_as_zero() -> None:
    """フレックスのエントリがなければ0として比較する。"""
    store = _same_total_record(flex_wins=0, flex_losses=0)
    riot = FakeRiot()
    riot.league = riot.league.model_copy(update={"flex_wins": 0, "flex_losses": 0})

    with installed(store, riot):
        asyncio.run(update_summoner("JP", "TestUser", "JP1"))

    assert riot.calls == ["league"]


def test_different_total_runs_full_update_without_refetching_league() -> None:
    """合計が異なれば従来の処理を行う。league entries は取り直さず、flex も保存する。"""
    store = _same_total_record(flex_wins=0, flex_losses=0, backfill_completed=True)
    riot = FakeRiot(history=make_history(3))

    with installed(store, riot):
        _, puuid = asyncio.run(update_summoner("JP", "TestUser", "JP1"))

    assert riot.calls.count("league") == 1
    assert riot.calls[:3] == ["league", "account_by_puuid", "profile"]
    assert store.touches == []
    assert len(store.upserts) == 1
    assert (store.upserts[0].flex_wins, store.upserts[0].flex_losses) == (3, 2)
    assert store.upserts[0].last_updated_at > _OLD_UPDATED_AT
    # 新しい試合を取りこぼさないよう、Backfill が完了済みでも開始する
    assert puuid == PUUID


def test_sync_part_uses_interactive_priority() -> None:
    """同期部分（更新）の Riot API 呼び出しは interactive で行う。"""
    store = _same_total_record(flex_wins=0, flex_losses=0)
    riot = FakeRiot(history=make_history(3))

    with installed(store, riot):
        asyncio.run(update_summoner("JP", "TestUser", "JP1"))

    assert [c["priority"] for c in riot.id_calls] == ["interactive"]
    assert riot.detail_priorities == ["interactive"]


def test_league_error_leaves_last_updated_at_unchanged() -> None:
    """league entries の取得に失敗したら何も更新せずエラーを返す。"""
    store = _same_total_record()
    riot = FakeRiot()
    riot.league_error = http_error(429)

    with installed(store, riot):
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(update_summoner("JP", "TestUser", "JP1"))

    assert exc_info.value.status_code == 429
    assert store.touches == [] and store.upserts == []
    assert store.records[PUUID].last_updated_at == _OLD_UPDATED_AT
