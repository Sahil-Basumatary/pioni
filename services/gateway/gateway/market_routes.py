import logging
import httpx
from fastapi import APIRouter, Query, HTTPException
from starlette.responses import Response
from gateway.response_cache import TTLByteCache
from gateway.settings import market_cache_ttl, market_data_service_url

logger = logging.getLogger(__name__)
market_router = APIRouter(prefix="/market", tags=["market"])
_client: httpx.AsyncClient | None = None
_price_cache = TTLByteCache(market_cache_ttl())

_JSON = "application/json"


async def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(
            base_url=market_data_service_url(),
            timeout=10.0,
        )
    return _client


async def close_market_client() -> None:
    global _client
    if _client:
        await _client.aclose()
        _client = None


async def _fetch_bytes(path: str) -> bytes:
    client = await _get_client()
    try:
        resp = await client.get(path)
    except httpx.RequestError as e:
        logger.error("market-data service unreachable", extra={"error": str(e)})
        raise HTTPException(
            status_code=503,
            detail={
                "error": "SERVICE_UNAVAILABLE",
                "message": "Market data service unreachable",
            },
        ) from None
    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=resp.json())
    return resp.content


async def _cached(path: str) -> Response:
    body = await _price_cache.get_or_load(path, lambda: _fetch_bytes(path))
    return Response(content=body, media_type=_JSON)


async def _proxy(path: str) -> dict:
    client = await _get_client()
    try:
        resp = await client.get(path)
        if resp.status_code >= 400:
            raise HTTPException(status_code=resp.status_code, detail=resp.json())
        return resp.json()
    except httpx.RequestError as e:
        logger.error("market-data service unreachable", extra={"error": str(e)})
        raise HTTPException(
            status_code=503,
            detail={
                "error": "SERVICE_UNAVAILABLE",
                "message": "Market data service unreachable",
            },
        ) from None


@market_router.get("/prices")
async def get_prices() -> Response:
    return await _cached("/prices")


@market_router.get("/prices/{symbol}")
async def get_price(symbol: str) -> Response:
    return await _cached(f"/prices/{symbol.upper()}")


@market_router.get("/klines/{symbol}")
async def get_klines(
    symbol: str,
    interval: str = Query(default="1m"),
    limit: int = Query(default=100, le=500),
):
    return await _proxy(f"/klines/{symbol}?interval={interval}&limit={limit}")
