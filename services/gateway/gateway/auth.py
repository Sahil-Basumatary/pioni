from __future__ import annotations
import logging
from dataclasses import dataclass
import jwt
from jwt import PyJWKClient
from jwt.exceptions import InvalidTokenError, PyJWKClientError
from fastapi import APIRouter, Depends, HTTPException, Request
from gateway.settings import (
    clerk_authorized_parties,
    clerk_issuer,
    clerk_jwks_url,
)

logger = logging.getLogger(__name__)

_jwks_client: PyJWKClient | None = None


@dataclass(frozen=True)
class AuthContext:
    clerk_id: str
    session_id: str | None = None


def _get_jwks_client() -> PyJWKClient | None:
    global _jwks_client
    if _jwks_client is not None:
        return _jwks_client
    url = clerk_jwks_url()
    if not url:
        return None
    # PyJWKClient caches keys in-process and re-fetches on an unknown key id, so Clerk's
    # signing-key rotation is handled without a redeploy.
    _jwks_client = PyJWKClient(url, cache_keys=True)
    return _jwks_client


def _unauthorized(message: str) -> HTTPException:
    return HTTPException(
        status_code=401,
        detail={"error": "UNAUTHORIZED", "message": message},
    )


def _bearer_token(request: Request) -> str:
    scheme, _, token = request.headers.get("authorization", "").partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise _unauthorized("missing bearer token")
    return token.strip()


def verify_token(token: str) -> AuthContext:
    client = _get_jwks_client()
    issuer = clerk_issuer()
    if client is None or not issuer:
        # Fail closed: an unconfigured verifier must reject every token rather than trust it.
        raise HTTPException(
            status_code=503,
            detail={
                "error": "AUTH_NOT_CONFIGURED",
                "message": "identity provider is not configured",
            },
        )
    try:
        signing_key = client.get_signing_key_from_jwt(token)
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=issuer,
            options={"verify_aud": False, "require": ["exp", "iat", "sub"]},
        )
    except jwt.ExpiredSignatureError:
        raise _unauthorized("token expired") from None
    except (InvalidTokenError, PyJWKClientError) as exc:
        logger.info("token verification failed", extra={"error": str(exc)})
        raise _unauthorized("invalid token") from None

    parties = clerk_authorized_parties()
    if parties and claims.get("azp") not in parties:
        raise _unauthorized("untrusted authorized party")

    return AuthContext(clerk_id=claims["sub"], session_id=claims.get("sid"))


async def require_auth(request: Request) -> AuthContext:
    ctx = verify_token(_bearer_token(request))
    request.state.auth = ctx
    return ctx


auth_router = APIRouter(tags=["auth"])


@auth_router.get("/me")
async def me(ctx: AuthContext = Depends(require_auth)) -> dict:
    return {"clerk_id": ctx.clerk_id, "session_id": ctx.session_id}
