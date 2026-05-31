# Feature: summoner-search-api, Property 3: 5xxエラーの502変換
"""5xxエラーの502変換プロパティテスト。

**Validates: Requirements 3.4**
"""

from unittest.mock import MagicMock

import httpx
import pytest
from fastapi import HTTPException
from hypothesis import given, settings
from hypothesis.strategies import integers

from services.summoner._error import handle_riot_error


@settings(max_examples=100)
@given(integers(min_value=500, max_value=599))
def test_5xx_errors_raise_502(status_code: int) -> None:
    """任意の5xxステータスコードに対して handle_riot_error() が HTTP 502 を発生させる。"""
    mock_response = MagicMock()
    mock_response.status_code = status_code
    e = httpx.HTTPStatusError("error", request=MagicMock(), response=mock_response)

    with pytest.raises(HTTPException) as exc_info:
        handle_riot_error(e)

    assert exc_info.value.status_code == 502
