"""adapters/lambda_invoker.py のテスト: 非同期起動（InvocationType=Event）の引数。"""

import asyncio
from typing import Any
from unittest.mock import MagicMock

import pytest

import adapters.lambda_invoker as lambda_invoker


def test_invokes_with_event_type_and_json_payload(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = MagicMock()
    monkeypatch.setattr(lambda_invoker, "_client", client)

    asyncio.run(lambda_invoker.invoke_async("fn", {"region": "JP", "puuid": "p"}))

    kwargs: dict[str, Any] = client.invoke.call_args.kwargs
    assert kwargs["FunctionName"] == "fn"
    assert kwargs["InvocationType"] == "Event"
    assert kwargs["Payload"] == b'{"region": "JP", "puuid": "p"}'


def test_propagates_invoke_errors(monkeypatch: pytest.MonkeyPatch) -> None:
    client = MagicMock()
    client.invoke.side_effect = RuntimeError("AccessDenied")
    monkeypatch.setattr(lambda_invoker, "_client", client)

    with pytest.raises(RuntimeError):
        asyncio.run(lambda_invoker.invoke_async("fn", {}))
