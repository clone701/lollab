"""AWS Lambda 関数の非同期起動。"""

import asyncio
import json
from typing import Any

_client: Any | None = None


def _get_client() -> Any:
    global _client
    if _client is None:
        import boto3

        _client = boto3.client("lambda")
    return _client


def _invoke(function_name: str, payload: dict[str, Any]) -> None:
    _get_client().invoke(
        FunctionName=function_name,
        InvocationType="Event",
        Payload=json.dumps(payload).encode("utf-8"),
    )


async def invoke_async(function_name: str, payload: dict[str, Any]) -> None:
    """関数を非同期（InvocationType=Event）で起動する。結果は待たない。

    Raises:
        Exception: 起動の要求に失敗した（権限なし・関数なしなど）
    """
    await asyncio.to_thread(_invoke, function_name, payload)
