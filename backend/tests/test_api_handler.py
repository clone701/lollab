"""lambda_handlers/api.py のテスト: Mangum が Lambda 関数 URL のイベントを FastAPI に渡す。

main は import 時に Supabase クライアントを作るため、軽量なアプリの代役に差し替える。

_Requirements: 2.1_
"""

import importlib
import json
import sys
from types import ModuleType
from typing import Any

import pytest
from fastapi import FastAPI


def _function_url_event(method: str, path: str) -> dict[str, Any]:
    """Lambda 関数 URL（ペイロード形式 2.0）のイベント。"""
    return {
        "version": "2.0",
        "routeKey": "$default",
        "rawPath": path,
        "rawQueryString": "",
        "headers": {"host": "example.lambda-url.ap-northeast-1.on.aws"},
        "requestContext": {
            "http": {
                "method": method,
                "path": path,
                "protocol": "HTTP/1.1",
                "sourceIp": "127.0.0.1",
                "userAgent": "test",
            },
            "stage": "$default",
        },
        "isBase64Encoded": False,
    }


def test_handler_returns_fastapi_response(monkeypatch: pytest.MonkeyPatch) -> None:
    app = FastAPI()

    @app.get("/api/ping")
    def ping() -> dict[str, str]:
        return {"pong": "ok"}

    fake_main = ModuleType("main")
    fake_main.app = app  # type: ignore[attr-defined]
    monkeypatch.setitem(sys.modules, "main", fake_main)
    monkeypatch.delitem(sys.modules, "lambda_handlers.api", raising=False)
    try:
        module = importlib.import_module("lambda_handlers.api")
        response = module.handler(_function_url_event("GET", "/api/ping"), None)
    finally:
        sys.modules.pop("lambda_handlers.api", None)

    assert response["statusCode"] == 200
    assert json.loads(response["body"]) == {"pong": "ok"}
