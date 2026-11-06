"""require_allowed_user のテスト: 自前で生成した鍵（JWKS はモック）と HS256 のシークレット。

_Requirements: 5.5, 5.8, 5.9_
"""

import time
from collections.abc import Iterator
from types import SimpleNamespace
from typing import Any

import jwt
import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

import adapters.supabase_jwks as jwks_module
from api.deps import auth
from tests.jwt_helpers import (
    EMAIL,
    HS_SECRET,
    KeyPair,
    claims,
    forge_hs256,
    hs256_token,
)

JWKS_URL = "https://ref.supabase.co/auth/v1/.well-known/jwks.json"

app = FastAPI()


@app.get("/protected", dependencies=[Depends(auth.require_allowed_user)])
def protected() -> dict[str, str]:
    return {"ok": "yes"}


client = TestClient(app)

ES_KEY = KeyPair("ES256")


def _settings(**overrides: Any) -> SimpleNamespace:
    values: dict[str, Any] = {
        "user_gate_enabled": True,
        "allowed_emails_list": [EMAIL],
        "supabase_jwks_url": JWKS_URL,
        "supabase_jwt_secret": "",
    }
    values.update(overrides)
    return SimpleNamespace(**values)


@pytest.fixture(autouse=True)
def gate(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    """既定: 有効、ES256 の JWKS を返す（外部に接続しない）。"""
    monkeypatch.setattr(auth, "settings", _settings())
    monkeypatch.setattr(auth, "supabase_jwks", jwks_module)
    monkeypatch.setattr(jwks_module, "_fetch", lambda url: ES_KEY.jwks())
    jwks_module.clear_cache()
    yield
    jwks_module.clear_cache()


def _get(token: str | None, scheme: str = "Bearer") -> int:
    headers = {} if token is None else {"X-Lollab-Auth": f"{scheme} {token}"}
    return int(client.get("/protected", headers=headers).status_code)


# --- 有効 ---


def test_valid_es256_token_is_accepted() -> None:
    assert _get(ES_KEY.sign(claims())) == 200


def test_valid_rs256_token_is_accepted(monkeypatch: pytest.MonkeyPatch) -> None:
    rsa_key = KeyPair("RS256", kid="rsa-1")
    monkeypatch.setattr(jwks_module, "_fetch", lambda url: rsa_key.jwks())
    assert _get(rsa_key.sign(claims())) == 200


def test_valid_hs256_token_is_accepted_when_secret_is_set(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(auth, "settings", _settings(supabase_jwt_secret=HS_SECRET))
    assert _get(hs256_token(claims())) == 200


def test_email_and_scheme_are_case_insensitive(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(auth, "settings", _settings(allowed_emails_list=[EMAIL]))
    token = ES_KEY.sign(claims(email=EMAIL.upper()))
    assert _get(token, scheme="bearer") == 200


# --- 401: 検証失敗 ---


def test_missing_header_is_401() -> None:
    assert _get(None) == 401


@pytest.mark.parametrize("value", ["Basic abc", "Bearer", "Bearer ", "abc"])
def test_malformed_header_is_401(value: str) -> None:
    assert client.get("/protected", headers={"X-Lollab-Auth": value}).status_code == 401


def test_authorization_header_alone_is_not_accepted() -> None:
    """Authorization は CloudFront が使うため、判定には使わない。"""
    headers = {"Authorization": f"Bearer {ES_KEY.sign(claims())}"}
    assert client.get("/protected", headers=headers).status_code == 401


def test_expired_token_is_401() -> None:
    assert _get(ES_KEY.sign(claims(exp=int(time.time()) - 10))) == 401


def test_token_without_exp_is_401() -> None:
    assert _get(ES_KEY.sign(claims(exp=None))) == 401


def test_bad_signature_is_401() -> None:
    forged = KeyPair("ES256")  # 同じ kid で別の鍵
    assert _get(forged.sign(claims())) == 401


def test_wrong_audience_is_401() -> None:
    assert _get(ES_KEY.sign(claims(aud="anon"))) == 401


def test_unknown_kid_is_401() -> None:
    assert _get(ES_KEY.sign(claims(), kid="other")) == 401


def test_alg_none_is_401() -> None:
    token = jwt.encode(claims(), None, algorithm="none")  # type: ignore[arg-type]
    assert _get(token) == 401


def test_unsupported_alg_is_401(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(auth, "settings", _settings(supabase_jwt_secret=HS_SECRET))
    token = jwt.encode(claims(), HS_SECRET * 2, algorithm="HS512")
    assert _get(token) == 401


def test_hs256_is_rejected_when_secret_is_not_set() -> None:
    assert _get(hs256_token(claims())) == 401


def test_hs256_with_wrong_secret_is_401(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(auth, "settings", _settings(supabase_jwt_secret=HS_SECRET))
    assert _get(hs256_token(claims(), secret="x" * 40)) == 401


def test_public_key_cannot_be_used_as_hs256_secret(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """公開鍵を HS256 のシークレットにした偽造トークンは通らない（alg の取り違え）。"""
    forged = forge_hs256(claims(), ES_KEY.public_pem)
    assert _get(forged) == 401  # シークレット未設定
    monkeypatch.setattr(auth, "settings", _settings(supabase_jwt_secret=HS_SECRET))
    assert _get(forged) == 401  # シークレット設定済み（別の値）


def test_es256_without_jwks_url_is_401(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(auth, "settings", _settings(supabase_jwks_url=None))
    assert _get(ES_KEY.sign(claims())) == 401


def test_jwks_fetch_failure_is_401(monkeypatch: pytest.MonkeyPatch) -> None:
    def broken(url: str) -> dict[str, Any]:
        raise RuntimeError("network down")

    monkeypatch.setattr(jwks_module, "_fetch", broken)
    assert _get(ES_KEY.sign(claims())) == 401


# --- 403 / 無効化 ---


def test_email_not_in_allowed_list_is_403(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(auth, "settings", _settings(allowed_emails_list=["x@y.z"]))
    assert _get(ES_KEY.sign(claims())) == 403


def test_empty_allowed_list_denies_everyone(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(auth, "settings", _settings(allowed_emails_list=[]))
    assert _get(ES_KEY.sign(claims())) == 403


def test_token_without_email_is_403() -> None:
    assert _get(ES_KEY.sign(claims(email=None))) == 403


def test_disabled_gate_skips_verification(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(auth, "settings", _settings(user_gate_enabled=False))
    assert _get(None) == 200
    assert _get("garbage") == 200


def test_error_response_does_not_leak_details() -> None:
    response = client.get("/protected", headers={"X-Lollab-Auth": "Bearer bad.token"})
    assert response.status_code == 401
    assert response.json() == {"detail": "認証が必要です"}
    assert response.headers["WWW-Authenticate"] == "Bearer"
