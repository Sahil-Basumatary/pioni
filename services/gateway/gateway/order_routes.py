import logging
import uuid
import httpx
from fastapi import APIRouter, Depends, Query, Request, HTTPException
from gateway.auth import AuthContext, require_auth
from gateway.me_routes import resolve_portfolio_id
from gateway.settings import orders_service_url

logger = logging.getLogger(__name__)
order_router = APIRouter(prefix="/orders", tags=["orders"])
orderbook_router = APIRouter(tags=["orderbook"])
_client: httpx.AsyncClient | None = None


async def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(
            base_url=orders_service_url(),
            timeout=10.0,
        )
    return _client


async def close_order_client() -> None:
    global _client
    if _client:
        await _client.aclose()
        _client = None


async def _proxy_response(resp: httpx.Response) -> dict:
    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=resp.json())
    return resp.json()


def _service_unavailable() -> HTTPException:
    return HTTPException(
        status_code=503,
        detail={
            "error": "SERVICE_UNAVAILABLE",
            "message": "Orders service unreachable",
        },
    )


@order_router.post("", status_code=201)
async def submit_order(request: Request, ctx: AuthContext = Depends(require_auth)):
    client = await _get_client()
    body = await request.json()
    # Override any client-supplied portfolio_id with the caller's own, resolved from the
    # verified identity — a user can never submit an order against another portfolio.
    body["portfolio_id"] = await resolve_portfolio_id(ctx)
    try:
        resp = await client.post("/orders", json=body)
        return await _proxy_response(resp)
    except httpx.RequestError as e:
        logger.error("orders service unreachable", extra={"error": str(e)})
        raise _service_unavailable() from None


@order_router.delete("/{order_id}")
async def cancel_order(
    order_id: uuid.UUID,
    ctx: AuthContext = Depends(require_auth),
):
    client = await _get_client()
    portfolio_id = await resolve_portfolio_id(ctx)
    try:
        resp = await client.delete(
            f"/orders/{order_id}",
            params={"portfolio_id": portfolio_id},
        )
        return await _proxy_response(resp)
    except httpx.RequestError as e:
        logger.error("orders service unreachable", extra={"error": str(e)})
        raise _service_unavailable() from None


@order_router.get("/{order_id}")
async def get_order(
    order_id: uuid.UUID,
    ctx: AuthContext = Depends(require_auth),
):
    client = await _get_client()
    portfolio_id = await resolve_portfolio_id(ctx)
    try:
        resp = await client.get(
            f"/orders/{order_id}",
            params={"portfolio_id": portfolio_id},
        )
        return await _proxy_response(resp)
    except httpx.RequestError as e:
        logger.error("orders service unreachable", extra={"error": str(e)})
        raise _service_unavailable() from None


@order_router.get("")
async def list_orders(
    ctx: AuthContext = Depends(require_auth),
    symbol: str | None = Query(None),
    status: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    client = await _get_client()
    params: dict = {
        "portfolio_id": await resolve_portfolio_id(ctx),
        "limit": limit,
        "offset": offset,
    }
    if symbol:
        params["symbol"] = symbol
    if status:
        params["status"] = status
    try:
        resp = await client.get("/orders", params=params)
        return await _proxy_response(resp)
    except httpx.RequestError as e:
        logger.error("orders service unreachable", extra={"error": str(e)})
        raise _service_unavailable() from None


@orderbook_router.get("/orderbook/{symbol}")
async def get_orderbook(
    symbol: str,
    depth: int = Query(10, ge=1, le=50),
):
    client = await _get_client()
    try:
        resp = await client.get(
            f"/orderbook/{symbol}",
            params={"depth": depth},
        )
        return await _proxy_response(resp)
    except httpx.RequestError as e:
        logger.error("orders service unreachable", extra={"error": str(e)})
        raise _service_unavailable() from None
