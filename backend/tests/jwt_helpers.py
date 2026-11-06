"""JWT 検証テスト用ヘルパー: テストで生成した鍵・JWKS・トークン（外部には接続しない）。"""

import base64
import hashlib
import hmac
import json
import time
from typing import Any

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec, rsa

KID = "test-key-1"
HS_SECRET = "test-hs256-secret-0123456789-0123456789"
EMAIL = "player@example.com"


class KeyPair:
    """署名用の秘密鍵（PEM）と、JWKS に載せる公開鍵（JWK）。"""

    def __init__(self, alg: str = "ES256", kid: str = KID) -> None:
        self.alg = alg
        self.kid = kid
        if alg == "ES256":
            private: Any = ec.generate_private_key(ec.SECP256R1())
            jwk = jwt.algorithms.ECAlgorithm.to_jwk(private.public_key(), as_dict=True)
        else:
            private = rsa.generate_private_key(public_exponent=65537, key_size=2048)
            jwk = jwt.algorithms.RSAAlgorithm.to_jwk(private.public_key(), as_dict=True)
        self.private_pem = private.private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.PKCS8,
            serialization.NoEncryption(),
        )
        self.public_pem = private.public_key().public_bytes(
            serialization.Encoding.PEM,
            serialization.PublicFormat.SubjectPublicKeyInfo,
        )
        self.jwk: dict[str, Any] = {**jwk, "kid": kid, "alg": alg, "use": "sig"}

    def jwks(self) -> dict[str, Any]:
        return {"keys": [self.jwk]}

    def sign(self, claims: dict[str, Any], kid: str | None = None) -> str:
        return jwt.encode(
            claims,
            self.private_pem,
            algorithm=self.alg,
            headers={"kid": kid or self.kid},
        )


def claims(**overrides: Any) -> dict[str, Any]:
    """有効なクレーム。値を None にすると、そのキーを外す。"""
    base: dict[str, Any] = {
        "sub": "user-1",
        "email": EMAIL,
        "aud": "authenticated",
        "exp": int(time.time()) + 3600,
    }
    base.update(overrides)
    return {k: v for k, v in base.items() if v is not None}


def hs256_token(payload: dict[str, Any], secret: str = HS_SECRET) -> str:
    return jwt.encode(payload, secret, algorithm="HS256")


def forge_hs256(payload: dict[str, Any], key: bytes) -> str:
    """任意のバイト列を HS256 のシークレットにして署名する（PyJWT が拒否する鍵も使える）。"""

    def encode(value: dict[str, Any]) -> bytes:
        raw = json.dumps(value, separators=(",", ":")).encode()
        return base64.urlsafe_b64encode(raw).rstrip(b"=")

    signing_input = (
        encode({"alg": "HS256", "typ": "JWT", "kid": KID}) + b"." + encode(payload)
    )
    signature = hmac.new(key, signing_input, hashlib.sha256).digest()
    return (
        signing_input + b"." + base64.urlsafe_b64encode(signature).rstrip(b"=")
    ).decode()
