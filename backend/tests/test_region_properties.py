# Feature: summoner-search-api, Property 1: 地域マッピングの完全性
"""地域マッピングの完全性プロパティテスト。

**Validates: Requirements 2.1, 2.2, 2.4**
"""

from hypothesis import given, settings
from hypothesis.strategies import sampled_from

from services.summoner.region import get_platform, get_regional

VALID_REGIONS = ["JP", "KR", "NA", "EUW", "EUNE", "OCE"]


@settings(max_examples=100)
@given(sampled_from(VALID_REGIONS))
def test_get_platform_returns_nonempty_string(region: str) -> None:
    """全ての有効なリージョン値に対して get_platform() が空でない文字列を返す。"""
    result = get_platform(region)
    assert isinstance(result, str)
    assert len(result) > 0


@settings(max_examples=100)
@given(sampled_from(VALID_REGIONS))
def test_get_regional_returns_nonempty_string(region: str) -> None:
    """全ての有効なリージョン値に対して get_regional() が空でない文字列を返す。"""
    result = get_regional(region)
    assert isinstance(result, str)
    assert len(result) > 0


# Feature: summoner-search-api, Property 2: 無効地域のエラー
"""無効地域のエラープロパティテスト。

**Validates: Requirements 2.3**
"""

import pytest
from fastapi import HTTPException
from hypothesis import given, settings
from hypothesis.strategies import text

VALID_REGIONS_UPPER = ["JP", "KR", "NA", "EUW", "EUNE", "OCE"]


@settings(max_examples=100)
@given(text().filter(lambda r: r.upper() not in VALID_REGIONS_UPPER))
def test_get_platform_raises_400_for_invalid_region(region: str) -> None:
    """許可されていないリージョン文字列に対して get_platform() が HTTP 400 を発生させる。"""
    with pytest.raises(HTTPException) as exc_info:
        get_platform(region)
    assert exc_info.value.status_code == 400


@settings(max_examples=100)
@given(text().filter(lambda r: r.upper() not in VALID_REGIONS_UPPER))
def test_get_regional_raises_400_for_invalid_region(region: str) -> None:
    """許可されていないリージョン文字列に対して get_regional() が HTTP 400 を発生させる。"""
    with pytest.raises(HTTPException) as exc_info:
        get_regional(region)
    assert exc_info.value.status_code == 400
