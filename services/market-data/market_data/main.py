import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import JSONResponse
import redis.asyncio as aioredis
from common import setup_logging, attach_request_id, instrument_app, instrument_app_tracing
from market_data.binance import BinanceWSClient
from market_data.publisher import MarketPublisher
from market_data.routes import router, set_publisher
from market_data.settings import (
    redis_url,
    redis_max_connections,
    trading_symbols,
    kline_intervals,
)

setup_logging()
logger = logging.getLogger(__name__)

_redis_pool: aioredis.ConnectionPool | None = None
_redis: aioredis.Redis | None = None
_binance_client: BinanceWSClient | None = None
_publisher: MarketPublisher | None = None


async def _init_redis() -> aioredis.Redis | None:
    global _redis_pool, _redis
    url = redis_url()
    if not url:
        logger.info("redis not configured, running without pub/sub")
        return None
    try:
        _redis_pool = aioredis.ConnectionPool.from_url(
            url,
            max_connections=redis_max_connections(),
            decode_responses=True,
        )
        _redis = aioredis.Redis(connection_pool=_redis_pool)
        await _redis.ping()
        logger.info("redis connected for market data pub/sub")
        return _redis
    except Exception as e:
        logger.warning("redis connection failed, running without pub/sub", extra={"error": str(e)})
        _redis_pool = None
        _redis = None
        return None


async def _close_redis() -> None:
    global _redis_pool, _redis
    if _redis:
        await _redis.aclose()
        _redis = None
    if _redis_pool:
        await _redis_pool.disconnect()
        _redis_pool = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _binance_client, _publisher
    redis_conn = await _init_redis()
    _publisher = MarketPublisher()
    _publisher.set_redis(redis_conn)
    set_publisher(_publisher)
    symbols = trading_symbols()
    intervals = kline_intervals()
    _binance_client = BinanceWSClient(
        symbols=symbols,
        kline_intervals=intervals,
        on_trade=_publisher.handle_trade,
        on_kline=_publisher.handle_kline,
    )
    await _binance_client.start()
    logger.info(
        "market-data service started",
        extra={"symbols": symbols, "intervals": intervals},
    )
    yield
    await _binance_client.stop()
    await _close_redis()
    logger.info("market-data service stopped")


app = FastAPI(
    title="Pioni Market Data Service", version="0.2.0", lifespan=lifespan
)
instrument_app(app, "market-data")
instrument_app_tracing(app, "market-data")
app.middleware("http")(attach_request_id)
app.include_router(router)


@app.get("/health")
async def health():
    return JSONResponse({"status": "healthy", "service": "market-data"})


@app.get("/health/live")
async def liveness():
    return JSONResponse({"status": "alive"})


@app.get("/health/ready")
async def readiness():
    connected = _binance_client.connected if _binance_client else False
    redis_ok = False
    if _redis:
        try:
            await _redis.ping()
            redis_ok = True
        except Exception:
            pass
    status = "ready" if connected else "degraded"
    return JSONResponse(
        {
            "status": status,
            "binance_ws": connected,
            "redis": redis_ok,
        },
        status_code=200 if connected else 503,
    )
