"""services/crawler/collect.py のテスト: 1人分の試合の収集。

_Requirements: 1.2〜1.5, 2.1, 3.3, 3.4_
"""

import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any

import pytest

from schemas.crawler import CollectResult
from tests.crawler_helpers import (
    CrawlerFakeStore,
    FakeSeedStore,
    install_crawler_stubs,
    install_seed_store,
    make_seed,
)
from tests.fake_riot import BASE_TIME, FakeRiot, make_history
from tests.riot_fetch_helpers import status_error
from tests.sync_helpers import installed

install_crawler_stubs()

from services.crawler import collect  # noqa: E402
from services.summoner.riot_errors import RiotRateLimitError  # noqa: E402

LAST_CRAWLED = BASE_TIME - timedelta(hours=10)


class Archive:
    async def save_detail(self, match_id: str, payload: dict[str, Any]) -> None:
        pass

    async def save_timeline(self, match_id: str, payload: dict[str, Any]) -> None:
        pass


def _collect(
    monkeypatch: pytest.MonkeyPatch,
    store: CrawlerFakeStore,
    riot: FakeRiot,
    seed_store: FakeSeedStore,
    tier: str = "DIAMOND",
    last_crawled_at: datetime | None = LAST_CRAWLED,
    result: CollectResult | None = None,
    archive: Archive | None = None,
) -> CollectResult:
    install_seed_store(monkeypatch, seed_store)
    seed = make_seed("seed-0", tier, last_crawled_at)  # type: ignore[arg-type]
    with installed(store, riot):
        return asyncio.run(
            collect.collect_seed("JP", seed, archive or Archive(), result)
        )


def test_requests_solo_queue_ids_since_last_crawl(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    riot = FakeRiot(make_history(3))

    _collect(monkeypatch, CrawlerFakeStore(), riot, FakeSeedStore())

    assert riot.id_calls == [
        {
            "start": 0,
            "count": 20,
            "start_time": LAST_CRAWLED,
            "end_time": None,
            "priority": "backfill",
            "queue": 420,
        }
    ]


def test_first_crawl_looks_back_3_days(monkeypatch: pytest.MonkeyPatch) -> None:
    riot = FakeRiot(make_history(3))
    before = datetime.now(timezone.utc)

    _collect(
        monkeypatch,
        CrawlerFakeStore(),
        riot,
        FakeSeedStore(),
        last_crawled_at=None,
    )

    start_time = riot.id_calls[0]["start_time"]
    assert (
        before - timedelta(days=3)
        <= start_time
        <= datetime.now(timezone.utc) - (timedelta(days=3))
    )


def test_skips_saved_and_gave_up_matches(monkeypatch: pytest.MonkeyPatch) -> None:
    store = CrawlerFakeStore(saved={"JP1_1": BASE_TIME})
    store.failed["JP1_2"] = (3, "HTTP 500", True)
    riot = FakeRiot(make_history(5))

    result = _collect(monkeypatch, store, riot, FakeSeedStore())

    assert riot.requested_details == ["JP1_0", "JP1_3", "JP1_4"]
    assert result.matches_saved == 3


def test_saves_with_rank_tier_and_bundle_archive(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    store = CrawlerFakeStore()
    riot = FakeRiot(make_history(2))
    archive = Archive()

    _collect(monkeypatch, store, riot, FakeSeedStore(), "MASTER", archive=archive)

    assert riot.archives == [archive]
    assert riot.detail_priorities == ["backfill"]
    assert [m.rank_tier for m in store.saved_matches] == ["MASTER", "MASTER"]
    assert {p.rank_tier for p in store.saved_participants} == {"MASTER"}
    assert len(store.saved_participants) == 2
    assert all(m.timeline_fetched_at is not None for m in store.saved_matches)


def test_marks_crawled_only_after_completing(monkeypatch: pytest.MonkeyPatch) -> None:
    seed_store = FakeSeedStore()
    before = datetime.now(timezone.utc)

    result = _collect(
        monkeypatch, CrawlerFakeStore(), FakeRiot(make_history(2)), seed_store
    )

    assert result.completed and not result.seed_failed
    [(puuid, at)] = seed_store.crawled
    assert puuid == "seed-0"
    assert before <= at <= datetime.now(timezone.utc)


def test_nothing_new_still_marks_crawled(monkeypatch: pytest.MonkeyPatch) -> None:
    seed_store = FakeSeedStore()
    store = CrawlerFakeStore(saved={f"JP1_{i}": BASE_TIME for i in range(3)})
    riot = FakeRiot(make_history(3))

    result = _collect(monkeypatch, store, riot, seed_store)

    assert riot.detail_calls == []
    assert result.completed and result.matches_saved == 0
    assert len(seed_store.crawled) == 1


def test_failed_matches_are_recorded_and_seed_is_not_marked(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    store = CrawlerFakeStore()
    riot = FakeRiot(make_history(3), fail_ids={"JP1_1"})
    seed_store = FakeSeedStore()

    result = _collect(monkeypatch, store, riot, seed_store)

    assert (result.matches_saved, result.matches_failed) == (2, 1)
    assert store.failed["JP1_1"] == (1, "HTTP 500", False)
    assert not result.completed
    assert seed_store.crawled == []


def test_third_failure_gives_up(monkeypatch: pytest.MonkeyPatch) -> None:
    store = CrawlerFakeStore()
    store.failed["JP1_1"] = (2, "HTTP 500", False)
    riot = FakeRiot(make_history(2), fail_ids={"JP1_1"})

    _collect(monkeypatch, store, riot, FakeSeedStore())

    assert store.failed["JP1_1"][2] is True


def test_success_clears_failed_record(monkeypatch: pytest.MonkeyPatch) -> None:
    store = CrawlerFakeStore()
    store.failed["JP1_0"] = (1, "HTTP 500", False)

    _collect(monkeypatch, store, FakeRiot(make_history(1)), FakeSeedStore())

    assert "JP1_0" not in store.failed


def test_rate_limit_saves_fetched_matches_and_raises(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    store = CrawlerFakeStore()
    riot = FakeRiot(make_history(4), rate_limit_after=2)
    seed_store = FakeSeedStore()
    partial = CollectResult()

    with pytest.raises(RiotRateLimitError):
        _collect(monkeypatch, store, riot, seed_store, result=partial)

    assert [m.match_id for m in store.saved_matches] == ["JP1_0", "JP1_1"]
    assert {m.rank_tier for m in store.saved_matches} == {"DIAMOND"}
    assert partial.matches_saved == 2
    assert seed_store.crawled == []
    assert not partial.completed


def test_rate_limit_on_id_list_raises_without_saving(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    riot = FakeRiot(make_history(2))
    riot.ids_error = RiotRateLimitError(status_error(429))
    seed_store = FakeSeedStore()

    with pytest.raises(RiotRateLimitError):
        _collect(monkeypatch, CrawlerFakeStore(), riot, seed_store)

    assert riot.detail_calls == [] and seed_store.crawled == []


def test_id_list_failure_skips_seed_without_marking(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    riot = FakeRiot(make_history(2))
    riot.ids_error = status_error(500)
    seed_store = FakeSeedStore()

    result = _collect(monkeypatch, CrawlerFakeStore(), riot, seed_store)

    assert result.seed_failed and not result.completed
    assert riot.detail_calls == [] and seed_store.crawled == []
