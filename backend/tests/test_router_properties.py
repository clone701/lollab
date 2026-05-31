# Feature: summoner-search-api, Property 6: 入力バリデーションの一貫性
"""入力バリデーションの一貫性プロパティテスト。

**Validates: Requirements 7.1, 7.2, 7.3**
"""

import sys
from unittest.mock import AsyncMock, MagicMock, patch

# config → pydantic_settings の import チェーンを回避するためにモックを注入する
# （.env に余分なフィールドがあり Settings の初期化が失敗するため）
_mock_settings = MagicMock()
_mock_config = MagicMock(settings=_mock_settings)
sys.modules["config"] = _mock_config

_mock_riot_api = MagicMock()
sys.modules["adapters"] = MagicMock(riot_api=_mock_riot_api)
sys.modules["adapters.riot_api"] = _mock_riot_api

from fastapi import FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from hypothesis import given, settings  # noqa: E402
from hypothesis.strategies import characters, text  # noqa: E402

from api.summoner.router import router  # noqa: E402

app = FastAPI()
app.include_router(router)
client = TestClient(app)

VALID_REGIONS = ["JP", "KR", "NA", "EUW", "EUNE", "OCE"]

# URL-safe な文字（英大文字・小文字・数字）のみを使用してエンコード問題を回避する
_url_safe_alphabet = characters(whitelist_categories=("Lu", "Ll", "Nd"))


@settings(max_examples=100)
@given(text(min_size=17, max_size=50, alphabet=_url_safe_alphabet))
def test_long_game_name_returns_422(game_name: str) -> None:
    """17文字以上の gameName に対してルーターが HTTP 422 を返す。"""
    with patch(
        "api.summoner.router.get_summoner_data",
        AsyncMock(return_value=None),
    ):
        response = client.get(f"/api/summoner/JP/{game_name}/JP1")
    assert response.status_code == 422


@settings(max_examples=100)
@given(text(min_size=6, max_size=20, alphabet=_url_safe_alphabet))
def test_long_tag_line_returns_422(tag_line: str) -> None:
    """6文字以上の tagLine に対してルーターが HTTP 422 を返す。"""
    with patch(
        "api.summoner.router.get_summoner_data",
        AsyncMock(return_value=None),
    ):
        response = client.get(f"/api/summoner/JP/ValidName/{tag_line}")
    assert response.status_code == 422


@settings(max_examples=100)
@given(
    text(min_size=1, max_size=10, alphabet=_url_safe_alphabet).filter(
        lambda r: r not in VALID_REGIONS
    )
)
def test_invalid_region_returns_422(region: str) -> None:
    """許可されていない region 値に対してルーターが HTTP 422 を返す。"""
    with patch(
        "api.summoner.router.get_summoner_data",
        AsyncMock(return_value=None),
    ):
        response = client.get(f"/api/summoner/{region}/ValidName/JP1")
    assert response.status_code == 422


# Feature: summoner-search-api, Property 7: エラーレスポンス形式の一貫性
"""エラーレスポンス形式の一貫性プロパティテスト。

**Validates: Requirements 8.1, 8.4**
"""

from fastapi import HTTPException  # noqa: E402
from hypothesis.strategies import sampled_from  # noqa: E402

# エラーステータスコード（422はFastAPIバリデーションが処理するため別途テスト）
ERROR_STATUS_CODES = [400, 404, 429, 502]


@settings(max_examples=100)
@given(sampled_from(ERROR_STATUS_CODES))
def test_error_response_format_consistency(status_code: int) -> None:
    """任意のエラー条件においてレスポンスボディが {"detail": "<message>"} 形式であることを確認する。

    スタックトレースや内部実装詳細が含まれないことも確認する。
    """
    with patch(
        "api.summoner.router.get_summoner_data",
        new_callable=AsyncMock,
        side_effect=HTTPException(status_code=status_code, detail="test error"),
    ):
        response = client.get("/api/summoner/JP/TestUser/JP1")

    assert response.status_code == status_code

    body = response.json()

    # {"detail": "<message>"} 形式であることを確認
    assert "detail" in body

    # スタックトレースが含まれないことを確認
    assert "traceback" not in body
    assert "stack_trace" not in body

    # 内部実装詳細が含まれないことを確認
    assert "internal" not in str(body).lower()


def test_422_validation_error_format() -> None:
    """無効なリージョンに対して422エラーが {"detail": ...} 形式で返ることを確認する。

    FastAPIのバリデーションエラーもスタックトレースを含まないことを確認する。
    """
    response = client.get("/api/summoner/INVALID/TestUser/JP1")

    assert response.status_code == 422

    body = response.json()

    # {"detail": ...} 形式であることを確認
    assert "detail" in body

    # スタックトレースが含まれないことを確認
    assert "traceback" not in body
    assert "stack_trace" not in body
