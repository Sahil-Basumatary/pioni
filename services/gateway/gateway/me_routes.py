import asyncio
import logging
import httpx
from common import redis_get, redis_set
from fastapi import APIRouter, Depends, HTTPException, Query
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


async def _proxy_portfolio_get(path: str, params: dict | None = None):
    # The portfolio service exposes these by portfolio_id in the path and trusts the private
    # network, so no identity headers are needed once the gateway has resolved ownership.
    client = await _get_client()
    try:
        resp = await client.get(path, params=params)
    except httpx.RequestError as e:
        logger.error("portfolio service unreachable", extra={"error": str(e)})
        raise _unavailable() from None
    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=resp.json())
    return resp.json()


async def _proxy_portfolio_post(path: str):
    client = await _get_client()
    try:
        resp = await client.post(path)
    except httpx.RequestError as e:
        logger.error("portfolio service unreachable", extra={"error": str(e)})
        raise _unavailable() from None
    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=resp.json())
    return resp.json()


@me_router.get("/summary")
async def my_summary(ctx: AuthContext = Depends(require_auth)):
    portfolio_id = await resolve_portfolio_id(ctx)
    return await _proxy_portfolio_get(f"/portfolios/{portfolio_id}/summary")


@me_router.get("/positions")
async def my_positions(
    ctx: AuthContext = Depends(require_auth),
    open_only: bool = Query(False),
):
    portfolio_id = await resolve_portfolio_id(ctx)
    return await _proxy_portfolio_get(
        f"/portfolios/{portfolio_id}/positions",
        params={"open_only": open_only},
    )


@me_router.get("/trades")
async def my_trades(
    ctx: AuthContext = Depends(require_auth),
    symbol: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    portfolio_id = await resolve_portfolio_id(ctx)
    params: dict = {"limit": limit, "offset": offset}
    if symbol:
        params["symbol"] = symbol
    return await _proxy_portfolio_get(
        f"/portfolios/{portfolio_id}/trades", params=params,
    )


@me_router.get("/pnl-chart")
async def my_pnl_chart(
    ctx: AuthContext = Depends(require_auth),
    days: int = Query(30, ge=1, le=365),
):
    portfolio_id = await resolve_portfolio_id(ctx)
    return await _proxy_portfolio_get(
        f"/portfolios/{portfolio_id}/pnl-chart", params={"days": days},
    )


@me_router.post("/portfolio/reset")
async def reset_my_portfolio(ctx: AuthContext = Depends(require_auth)):
    portfolio_id = await resolve_portfolio_id(ctx)
    return await _proxy_portfolio_post(f"/portfolios/{portfolio_id}/reset")
