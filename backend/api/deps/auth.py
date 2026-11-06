"""利用者の制限（第2段階）: X-Lollab-Auth の JWT を検証し、許可メールか判定する。

Authorization ヘッダーは CloudFront のベーシック認証と OAC 署名が使うため、
Supabase のアクセストークンは X-Lollab-Auth: Bearer <JWT> で受け取る。
"""

import logging
from typing import Annotated, Any

import jwt
from fastapi import Header, HTTPException

from adapters import supabase_jwks
from config import settings

logger = logging.getLogger(__name__)

AUDIENCE = "authenticated"
# alg ごとに検証方法を固定する（公開鍵を HS256 のシークレットとして使う取り違えを防ぐ）
_JWKS_ALGORITHMS = ("ES256", "RS256")


def _unauthorized(reason: str) -> HTTPException:
    # 理由はログだけに残し、応答には含めない（トークンは記録しない）
    logger.info("認証に失敗しました: %s", reason)
    return HTTPException(
        status_code=401,
        detail="認証が必要です",
        headers={"WWW-Authenticate": "Bearer"},
    )


def extract_bearer(value: str | None) -> str | None:
    """ "Bearer <token>" からトークンを取り出す。形式が違えば None。"""
    if not value:
        return None
    scheme, _, token = value.partition(" ")
    token = token.strip()
    if scheme.lower() != "bearer" or not token:
        return None
    return token


def _verification_key(alg: str, header: dict[str, Any]) -> Any:
    if alg in _JWKS_ALGORITHMS:
        url = settings.supabase_jwks_url
        if url is None:
            raise _unauthorized("JWKS の URL が未設定")
        try:
            key = supabase_jwks.get_signing_key(url, header.get("kid"))
        except Exception:
            logger.error("JWKS を取得できませんでした", exc_info=True)
            raise _unauthorized("JWKS を取得できない") from None
        if key is None:
            raise _unauthorized("kid に対応する鍵がない")
        return key
    if alg == "HS256":
        if not settings.supabase_jwt_secret:
            raise _unauthorized("HS256 のシークレットが未設定")
        return settings.supabase_jwt_secret
    raise _unauthorized(f"未対応の alg: {alg}")


def verify_token(token: str) -> dict[str, Any]:
    """JWT の署名・aud・exp を検証して、クレームを返す。

    Raises:
        HTTPException: 401（検証に失敗）
    """
    try:
        header = jwt.get_unverified_header(token)
        alg = str(header.get("alg", ""))
        key = _verification_key(alg, header)
        return jwt.decode(
            token,
            key,
            algorithms=[alg],
            audience=AUDIENCE,
            options={"require": ["exp", "aud"]},
        )
    except HTTPException:
        raise
    except Exception as e:
        # 鍵の形式不正などの予期しない例外も、認証失敗（401）として扱う
        raise _unauthorized(type(e).__name__) from None


def require_allowed_user(
    x_lollab_auth: Annotated[str | None, Header()] = None,
) -> None:
    """許可したメールアドレスの利用者だけを通す。

    USER_GATE_ENABLED が false なら判定しない。

    Raises:
        HTTPException: 401（ヘッダーなし・検証失敗）、403（許可外のメールアドレス）
    """
    if not settings.user_gate_enabled:
        return
    token = extract_bearer(x_lollab_auth)
    if token is None:
        raise _unauthorized("X-Lollab-Auth がない、または形式が不正")
    email = str(verify_token(token).get("email", "")).strip().lower()
    if not email or email not in settings.allowed_emails_list:
        logger.info("許可されていない利用者です")
        raise HTTPException(status_code=403, detail="このアカウントでは利用できません")
