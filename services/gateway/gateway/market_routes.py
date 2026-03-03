import logging
import httpx
from fastapi import APIRouter, Query, HTTPException
from gateway.settings import market_data_service_url

logger = logging.getLogger(__name__)
market_router = APIRouter(prefix="/market", tags=["market"])
_client: httpx.AsyncClient | None = None


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
async def get_prices():
    return await _proxy("/prices")


@market_router.get("/prices/{symbol}")
async def get_price(symbol: str):
    return await _proxy(f"/prices/{symbol}")


@market_router.get("/klines/{symbol}")
async def get_klines(
    symbol: str,
    interval: str = Query(default="1m"),
    limit: int = Query(default=100, le=500),
):
    return await _proxy(f"/klines/{symbol}?interval={interval}&limit={limit}")
