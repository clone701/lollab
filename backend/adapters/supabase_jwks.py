"""Supabase Auth の JWKS（JWT の公開鍵）の取得とキャッシュ。

JWKS はメモリに保持し、有効期間を過ぎたら取り直す。未知の kid が来たときは
取り直して再確認する。ただし不正な kid による連続アクセスで Supabase を
叩き続けないよう、直前の取得から一定時間は取り直さない。
"""

import logging
import threading
import time
from typing import Any

import httpx
from jwt import PyJWK, PyJWKSet

logger = logging.getLogger(__name__)

# JWKS を使い回す秒数
CACHE_SECONDS = 600
# 未知の kid による取り直しの最短間隔（秒）
REFETCH_COOLDOWN_SECONDS = 30
_TIMEOUT_SECONDS = 5.0

_lock = threading.Lock()
_keys: dict[str, PyJWK] = {}
_url: str | None = None
_fetched_at: float | None = None


def _clock() -> float:
    return time.monotonic()


def _fetch(url: str) -> dict[str, Any]:
    response = httpx.get(url, timeout=_TIMEOUT_SECONDS)
    response.raise_for_status()
    return response.json()  # type: ignore[no-any-return]


def _refresh(url: str) -> None:
    global _keys, _url, _fetched_at
    jwk_set = PyJWKSet.from_dict(_fetch(url))
    _keys = {jwk.key_id: jwk for jwk in jwk_set.keys if jwk.key_id}
    _url = url
    _fetched_at = _clock()


def get_signing_key(url: str, kid: str | None) -> Any | None:
    """kid に対応する公開鍵を返す。見つからなければ None。

    Raises:
        Exception: JWKS を取得できなかった（呼び出し側で認証失敗として扱う）
    """
    if not kid:
        return None
    with _lock:
        now = _clock()
        stale = _url != url or _fetched_at is None or now - _fetched_at >= CACHE_SECONDS
        if stale:
            _refresh(url)
        elif kid not in _keys and now - (_fetched_at or 0) >= REFETCH_COOLDOWN_SECONDS:
            logger.info("未知の kid のため JWKS を取り直します")
            _refresh(url)
        jwk = _keys.get(kid)
        return jwk.key if jwk else None


def clear_cache() -> None:
    """キャッシュを破棄する（テスト用）。"""
    global _keys, _url, _fetched_at
    with _lock:
        _keys, _url, _fetched_at = {}, None, None
