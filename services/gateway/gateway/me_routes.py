import logging
import httpx
from fastapi import APIRouter, Depends, HTTPException
from gateway.auth import AuthContext, require_auth
from gateway.settings import portfolio_service_url

logger = logging.getLogger(__name__)
me_router = APIRouter(prefix="/me", tags=["me"])
_client: httpx.AsyncClient | None = None


async def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(base_url=portfolio_service_url(), timeout=10.0)
    return _client


async def close_portfolio_client() -> None:
    global _client
    if _client:
        await _client.aclose()
        _client = None


def _identity_headers(ctx: AuthContext) -> dict[str, str]:
    # The gateway is the only component that trusts the JWT; internal services trust these
    # forwarded headers over the private network.
    headers = {"X-Clerk-Id": ctx.clerk_id}
    if ctx.email:
        headers["X-User-Email"] = ctx.email
    if ctx.username:
        headers["X-User-Name"] = ctx.username
    return headers


def _unavailable() -> HTTPException:
    return HTTPException(
        status_code=503,
        detail={
            "error": "SERVICE_UNAVAILABLE",
            "message": "Portfolio service unreachable",
        },
    )


@me_router.get("/portfolio")
async def my_portfolio(ctx: AuthContext = Depends(require_auth)) -> dict:
    client = await _get_client()
    try:
        resp = await client.get("/me/portfolio", headers=_identity_headers(ctx))
    except httpx.RequestError as e:
        logger.error("portfolio service unreachable", extra={"error": str(e)})
        raise _unavailable() from None
    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=resp.json())
    return resp.json()
