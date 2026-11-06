"""dispatch_backfill のテスト: lambda モードは非同期起動、inline モードは BackgroundTasks。

_Requirements: 2.3_
"""

import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

import adapters.lambda_invoker as lambda_invoker
from services.summoner import backfill_dispatch


def _settings(mode: str, function_name: str = "lollab-backfill") -> SimpleNamespace:
    return SimpleNamespace(backfill_mode=mode, backfill_function_name=function_name)


@pytest.fixture(autouse=True)
def invoker(monkeypatch: pytest.MonkeyPatch) -> AsyncMock:
    mock = AsyncMock()
    monkeypatch.setattr(backfill_dispatch, "lambda_invoker", lambda_invoker)
    monkeypatch.setattr(lambda_invoker, "invoke_async", mock)
    return mock


def _dispatch() -> MagicMock:
    tasks = MagicMock()
    asyncio.run(backfill_dispatch.dispatch_backfill(tasks, "JP", "puuid-0"))
    return tasks


def test_inline_mode_adds_background_task(
    monkeypatch: pytest.MonkeyPatch, invoker: AsyncMock
) -> None:
    monkeypatch.setattr(backfill_dispatch, "settings", _settings("inline"))

    tasks = _dispatch()

    tasks.add_task.assert_called_once_with(
        backfill_dispatch.run_backfill, "JP", "puuid-0"
    )
    invoker.assert_not_awaited()


def test_lambda_mode_invokes_function_asynchronously(
    monkeypatch: pytest.MonkeyPatch, invoker: AsyncMock
) -> None:
    monkeypatch.setattr(backfill_dispatch, "settings", _settings("lambda"))

    tasks = _dispatch()

    invoker.assert_awaited_once_with(
        "lollab-backfill", {"region": "JP", "puuid": "puuid-0"}
    )
    tasks.add_task.assert_not_called()


def test_lambda_mode_swallows_invoke_errors(
    monkeypatch: pytest.MonkeyPatch, invoker: AsyncMock
) -> None:
    monkeypatch.setattr(backfill_dispatch, "settings", _settings("lambda"))
    invoker.side_effect = RuntimeError("AccessDenied")

    tasks = _dispatch()  # 例外が出ないこと

    tasks.add_task.assert_not_called()


def test_lambda_mode_without_function_name_does_nothing(
    monkeypatch: pytest.MonkeyPatch, invoker: AsyncMock
) -> None:
    monkeypatch.setattr(backfill_dispatch, "settings", _settings("lambda", ""))

    tasks = _dispatch()

    invoker.assert_not_awaited()
    tasks.add_task.assert_not_called()
