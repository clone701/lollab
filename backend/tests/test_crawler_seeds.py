"""services/crawler/seeds.py のテスト: 更新の要否・取得・削除・帯ごとの交互の選択。

_Requirements: 1.3, 1.6_
"""

import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any

import pytest

from tests.crawler_helpers import (
    FakeSeedStore,
    install_crawler_stubs,
    install_seed_store,
    make_seed,
)

install_crawler_stubs()

from services.crawler import seeds  # noqa: E402


class FakeLeague:
    """league-v4 の代役。パスごとにエントリーを返し、呼び出しを記録する。"""

    def __init__(self, fail_on: str | None = None) -> None:
        self.calls: list[tuple[str, str, Any, Any]] = []
        self.fail_on = fail_on

    async def __call__(
        self, host: str, path: str, params: Any = None, priority: Any = None
    ) -> Any:
        self.calls.append((host, path, params, priority))
        if self.fail_on and self.fail_on in path:
            raise RuntimeError("boom")
        if "challengerleagues" in path:
            return {"entries": [{"puuid": "c1", "leaguePoints": 900, "rank": "I"}]}
        if "grandmasterleagues" in path:
            # puuid のない要素は飛ばす
            return {"entries": [{"puuid": "g1", "leaguePoints": 600}, {"lp": 1}]}
        if "masterleagues" in path:
            return {"entries": [{"puuid": "m1", "leaguePoints": 300}]}
        tier, division = path.split("/")[-2:]
        entries = [{"puuid": f"{tier}-{division}", "leaguePoints": 10}]
        if tier == "DIAMOND" and division == "I":
            # マスター以上にもいるプレイヤー（昇格直後）は、高いランクを残す
            entries.append({"puuid": "c1", "leaguePoints": 99})
        return entries


@pytest.fixture
def league(monkeypatch: pytest.MonkeyPatch) -> FakeLeague:
    fake = FakeLeague()
    monkeypatch.setattr(seeds, "get_riot", fake)
    return fake


def _refresh(store: FakeSeedStore, monkeypatch: pytest.MonkeyPatch) -> None:
    install_seed_store(monkeypatch, store)
    asyncio.run(seeds.refresh_seeds_if_stale("JP"))


def test_refresh_fetches_all_lists_and_upserts(
    monkeypatch: pytest.MonkeyPatch, league: FakeLeague
) -> None:
    store = FakeSeedStore(last_refreshed_at=None)

    _refresh(store, monkeypatch)

    # マスター以上 3回 + ダイヤモンド・エメラルド 8回
    assert len(league.calls) == 11
    assert {c[0] for c in league.calls} == {"jp1"}
    assert {c[3] for c in league.calls} == {"backfill"}
    paths = [c[1] for c in league.calls]
    assert "/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5" in paths
    assert "/lol/league/v4/entries/RANKED_SOLO_5x5/EMERALD/IV" in paths
    entry_calls = [c for c in league.calls if "/entries/" in c[1]]
    assert all(c[2] == {"page": 1} for c in entry_calls)

    by_puuid = {s.puuid: s for s in store.upserted}
    assert store.upsert_region == "JP"
    assert by_puuid["c1"].tier == "CHALLENGER" and by_puuid["c1"].division is None
    assert by_puuid["c1"].league_points == 900
    assert by_puuid["g1"].tier == "GRANDMASTER"
    assert by_puuid["EMERALD-IV"].tier == "EMERALD"
    assert by_puuid["EMERALD-IV"].division == "IV"
    assert len(store.upserted) == len(by_puuid) == 3 + 8  # puuid なしと重複は除く
    assert all(s.last_crawled_at is None for s in store.upserted)


def test_refresh_deletes_seeds_not_seen_for_7_days(
    monkeypatch: pytest.MonkeyPatch, league: FakeLeague
) -> None:
    store = FakeSeedStore(last_refreshed_at=None)

    _refresh(store, monkeypatch)

    refreshed = store.upserted[0].refreshed_at
    assert store.deleted_older_than == refreshed - timedelta(days=7)


def test_refresh_is_skipped_within_24_hours(
    monkeypatch: pytest.MonkeyPatch, league: FakeLeague
) -> None:
    recent = datetime.now(timezone.utc) - timedelta(hours=23)
    store = FakeSeedStore(last_refreshed_at=recent)

    _refresh(store, monkeypatch)

    assert league.calls == []
    assert store.upserted == []


def test_refresh_runs_after_24_hours(
    monkeypatch: pytest.MonkeyPatch, league: FakeLeague
) -> None:
    old = datetime.now(timezone.utc) - timedelta(hours=25)
    store = FakeSeedStore(last_refreshed_at=old)

    _refresh(store, monkeypatch)

    assert len(league.calls) == 11
    assert store.upserted != []


def test_refresh_failure_keeps_existing_seeds_and_does_not_raise(
    monkeypatch: pytest.MonkeyPatch, league: FakeLeague
) -> None:
    """途中で失敗したら、一部だけ書き込まず、既存の収集元をそのまま使う。"""
    league.fail_on = "DIAMOND/II"
    existing = make_seed("old-seed")
    store = FakeSeedStore([existing], last_refreshed_at=None)

    _refresh(store, monkeypatch)

    assert store.upserted == []
    assert store.deleted_older_than is None
    assert list(store.seeds) == ["old-seed"]


def test_refresh_with_no_entries_does_not_write(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def empty(*args: Any, **kwargs: Any) -> Any:
        return {"entries": []} if "by-queue" in args[1] else []

    monkeypatch.setattr(seeds, "get_riot", empty)
    store = FakeSeedStore(last_refreshed_at=None)

    _refresh(store, monkeypatch)

    assert store.upserted == [] and store.deleted_older_than is None


def test_pick_alternates_bands_oldest_first(monkeypatch: pytest.MonkeyPatch) -> None:
    t = datetime(2026, 11, 1, tzinfo=timezone.utc)
    store = FakeSeedStore(
        [
            make_seed("e-new", "EMERALD", t + timedelta(hours=2)),
            make_seed("e-null", "EMERALD", None),
            make_seed("e-old", "EMERALD", t),
            make_seed("d-old", "DIAMOND", t),
            make_seed("d-null", "DIAMOND", None),
            make_seed("m-1", "MASTER", t + timedelta(hours=1)),
            make_seed("c-1", "CHALLENGER", t),
        ]
    )
    install_seed_store(monkeypatch, store)

    picked = asyncio.run(seeds.pick_seeds(30))

    assert [s.puuid for s in picked] == [
        "e-null",  # 1周目: エメラルド → ダイヤモンド → マスター以上（古い順）
        "d-null",
        "c-1",
        "e-old",  # 2周目
        "d-old",
        "m-1",
        "e-new",  # 3周目: 残っている帯だけ
    ]
    assert [b for b, _ in store.band_calls] == [
        ["EMERALD"],
        ["DIAMOND"],
        ["MASTER", "GRANDMASTER", "CHALLENGER"],
    ]


def test_pick_respects_limit_and_skips_empty_bands(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    store = FakeSeedStore([make_seed(f"e-{i}", "EMERALD") for i in range(5)])
    install_seed_store(monkeypatch, store)

    picked = asyncio.run(seeds.pick_seeds(3))

    assert len(picked) == 3
    assert all(s.tier == "EMERALD" for s in picked)


def test_pick_returns_empty_without_seeds(monkeypatch: pytest.MonkeyPatch) -> None:
    install_seed_store(monkeypatch, FakeSeedStore())

    assert asyncio.run(seeds.pick_seeds(30)) == []
