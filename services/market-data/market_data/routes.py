import logging
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from market_data.publisher import MarketPublisher

logger = logging.getLogger(__name__)
router = APIRouter()

_publisher: MarketPublisher | None = None


def set_publisher(pub: MarketPublisher) -> None:
    global _publisher
    _publisher = pub


@router.get("/prices")
async def get_all_prices():
    if not _publisher:
        return JSONResponse({"error": "service_not_ready"}, status_code=503)
    snapshots = _publisher.get_all_snapshots()
    return {
        symbol: snap.model_dump(mode="json")
        for symbol, snap in snapshots.items()
    }


@router.get("/prices/{symbol}")
async def get_price(symbol: str):
    if not _publisher:
        return JSONResponse({"error": "service_not_ready"}, status_code=503)
    snap = _publisher.get_snapshot(symbol.upper())
    if not snap:
        return JSONResponse({"error": "symbol_not_found"}, status_code=404)
    return snap.model_dump(mode="json")


@router.get("/klines/{symbol}")
async def get_klines(
    symbol: str,
    interval: str = Query(default="1m"),
    limit: int = Query(default=100, le=500),
):
    if not _publisher:
        return JSONResponse({"error": "service_not_ready"}, status_code=503)
    klines = _publisher.get_klines(symbol.upper(), interval, limit)
    return {"symbol": symbol.upper(), "interval": interval, "klines": klines}
