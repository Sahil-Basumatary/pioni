import asyncio
import logging
import httpx
from common import redis_get, redis_set
from fastapi import APIRouter, Depends, HTTPException
from gateway.auth import AuthContext, require_auth
from gateway.cache import TTLCache
from gateway.clerk_backend import set_portfolio_metadata
from gateway.settings import (
    clerk_metadata_sync_enabled,
    portfolio_cache_redis_ttl,
    portfolio_cache_ttl,
    portfolio_service_url,
)

logger = logging.getLogger(__name__)
me_router = APIRouter(prefix="/me", tags=["me"])
_client: httpx.AsyncClient | None = None
_portfolio_id_cache = TTLCache(portfolio_cache_ttl())
_REDIS_KEY_PREFIX = "gw:portfolio_id:"
# Holds strong references to fire-and-forget backfill tasks so the event loop cannot garbage
# collect them mid-flight; entries remove themselves on completion.
_background_tasks: set[asyncio.Task] = set()


def _redis_key(clerk_id: str) -> str:
    return f"{_REDIS_KEY_PREFIX}{clerk_id}"


def _spawn(coro) -> None:
    task = asyncio.create_task(coro)
    _background_tasks.add(task)
    task.add_done_callback(_background_tasks.discard)


async def _sync_clerk_metadata(clerk_id: str, portfolio_id: str) -> None:
    if not clerk_metadata_sync_enabled():
        return
    await set_portfolio_metadata(clerk_id, portfolio_id)


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


async def fetch_my_portfolio(ctx: AuthContext) -> dict:
    client = await _get_client()
    try:
        resp = await client.get("/me/portfolio", headers=_identity_headers(ctx))
    except httpx.RequestError as e:
        logger.error("portfolio service unreachable", extra={"error": str(e)})
        raise _unavailable() from None
    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=resp.json())
    return resp.json()


async def resolve_portfolio_id(ctx: AuthContext) -> str:
   
    if ctx.portfolio_id:
        return ctx.portfolio_id

    cached = _portfolio_id_cache.get(ctx.clerk_id)
    if cached is not None:
        return cached

    from_redis = await redis_get(_redis_key(ctx.clerk_id))
    if from_redis:
        _portfolio_id_cache.set(ctx.clerk_id, from_redis)
        return from_redis

    portfolio_id = str((await fetch_my_portfolio(ctx))["id"])
    _portfolio_id_cache.set(ctx.clerk_id, portfolio_id)
    _spawn(redis_set(_redis_key(ctx.clerk_id), portfolio_id, portfolio_cache_redis_ttl()))
    _spawn(_sync_clerk_metadata(ctx.clerk_id, portfolio_id))
    return portfolio_id


@me_router.get("/portfolio")
async def my_portfolio(ctx: AuthContext = Depends(require_auth)) -> dict:
    return await fetch_my_portfolio(ctx)
