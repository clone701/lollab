"""sync.py のテスト: Riot API の接続エラー・タイムアウトを 502 に変換する。"""

import asyncio

import httpx
import pytest
from fastapi import HTTPException

from tests.fake_riot import PUUID, FakeRiot, make_history
from tests.sync_helpers import FakeStore, install_store_stub, installed

install_store_stub()

from services.summoner.sync import sync_recent_matches  # noqa: E402


@pytest.mark.parametrize("error_type", [httpx.ConnectError, httpx.ReadTimeout])
def test_sync_recent_matches_request_error_becomes_502(
    error_type: type[httpx.RequestError], caplog: pytest.LogCaptureFixture
) -> None:
    """試合ID一覧の接続エラー・タイムアウトは、ログに記録して 502 に変換する。"""
    store = FakeStore()
    riot = FakeRiot(history=make_history(5))
    riot.ids_error = error_type("boom")

    with installed(store, riot), caplog.at_level("ERROR"):
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(sync_recent_matches("JP", PUUID))

    assert exc_info.value.status_code == 502
    assert exc_info.value.detail == "Riot APIが一時的に利用できません"
    assert any(r.levelname == "ERROR" for r in caplog.records)
    assert store.saved == {}
