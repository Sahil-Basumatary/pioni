import logging
import asyncio
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
import httpx
import redis.asyncio as aioredis
from common import (
    setup_logging, attach_request_id, init_redis_pool,
    close_redis_pool, MarketSubscriber, OrderSubscriber, PortfolioSubscriber,
)
from common import create_rate_limit_middleware
from gateway.routes import router, close_http_client
from gateway.market_routes import market_router, close_market_client
from gateway.order_routes import order_router, orderbook_router, close_order_client
from gateway.ws import (
    ws_router,
    get_manager,
    get_order_manager,
    get_portfolio_manager,
)
from gateway.settings import (
    cors_origins, is_mock_mode, prewarm_enabled,
    prewarm_tickers, redis_url,
)

setup_logging()
logger = logging.getLogger(__name__)

_pubsub_redis: aioredis.Redis | None = None
_subscriber: MarketSubscriber | None = None
_order_subscriber: OrderSubscriber | None = None
_portfolio_subscriber: PortfolioSubscriber | None = None


async def _init_pubsub() -> None:
    global _pubsub_redis, _subscriber, _order_subscriber, _portfolio_subscriber
    url = redis_url()
    if not url:
        logger.info("redis not configured, market data streaming disabled")
        return
    try:
        _pubsub_redis = aioredis.from_url(url, decode_responses=True)
        await _pubsub_redis.ping()
        manager = get_manager()
        _subscriber = MarketSubscriber(
            redis=_pubsub_redis,
            on_trade=manager.broadcast_trade,
            on_kline=manager.broadcast_kline,
        )
        await _subscriber.start()
        logger.info("market data pub/sub subscriber started")
        order_mgr = get_order_manager()
        _order_subscriber = OrderSubscriber(
            redis=_pubsub_redis,
            on_order_status=order_mgr.broadcast_order_update,
        )
        await _order_subscriber.start()
        logger.info("order status pub/sub subscriber started")
        portfolio_mgr = get_portfolio_manager()
        _portfolio_subscriber = PortfolioSubscriber(
            redis=_pubsub_redis,
            on_portfolio_update=portfolio_mgr.broadcast_portfolio_update,
        )
        await _portfolio_subscriber.start()
        logger.info("portfolio update pub/sub subscriber started")
    except Exception as e:
        logger.warning(
            "failed to start pub/sub subscribers",
            extra={"error": str(e)},
        )
        _pubsub_redis = None
        _subscriber = None
        _order_subscriber = None
        _portfolio_subscriber = None


async def _close_pubsub() -> None:
    global _pubsub_redis, _subscriber, _order_subscriber, _portfolio_subscriber
    if _portfolio_subscriber:
        await _portfolio_subscriber.stop()
        _portfolio_subscriber = None
    if _order_subscriber:
        await _order_subscriber.stop()
        _order_subscriber = None
    if _subscriber:
        await _subscriber.stop()
        _subscriber = None
    if _pubsub_redis:
        await _pubsub_redis.aclose()
        _pubsub_redis = None


async def _warm_cache() -> None:
    await asyncio.sleep(3)
    tickers = prewarm_tickers()
    base_url = "http://127.0.0.1:8000"
    async with httpx.AsyncClient(base_url=base_url, timeout=60.0) as client:
        for _attempt in range(5):
            try:
                resp = await client.get("/health")
                if resp.status_code == 200:
                    break
            except httpx.RequestError:
                pass
            await asyncio.sleep(1)
        else:
            logger.warning("prewarm: server health check failed after 5 attempts, skipping")
            return
        logger.info(f"prewarm: starting cache warm for {len(tickers)} tickers")
        warmed = 0
        for ticker in tickers:
            start = time.perf_counter()
            try:
                resp = await client.get(f"/sentiment/{ticker}")
                elapsed_ms = (time.perf_counter() - start) * 1000
                if resp.status_code == 200:
                    warmed += 1
                    logger.info(f"prewarm: {ticker} warmed in {elapsed_ms:.0f}ms")
                else:
                    logger.warning(f"prewarm: {ticker} returned {resp.status_code} in {elapsed_ms:.0f}ms")
            except httpx.RequestError as e:
                elapsed_ms = (time.perf_counter() - start) * 1000
                logger.warning(f"prewarm: {ticker} failed after {elapsed_ms:.0f}ms - {e}")
        logger.info(f"prewarm: completed {warmed}/{len(tickers)} tickers")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_redis_pool()
    await _init_pubsub()
    if prewarm_enabled() and not is_mock_mode():
        asyncio.create_task(_warm_cache())
    yield
    await close_http_client()
    await close_market_client()
    await close_order_client()
    await _close_pubsub()
    await close_redis_pool()

app = FastAPI(title="Pioni API", version="0.4.0", lifespan=lifespan)

app.middleware("http")(attach_request_id)

rate_limit_middleware = create_rate_limit_middleware(cors_origins)
app.middleware("http")(rate_limit_middleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Cache", "X-Mode", "X-Request-ID"],
)
app.add_middleware(GZipMiddleware, minimum_size=500)

app.include_router(router)
app.include_router(market_router)
app.include_router(order_router)
app.include_router(orderbook_router)
app.include_router(ws_router)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTP_ERROR",
            "message": str(exc.detail),
            "request_id": getattr(request.state, "request_id", None),
        },
    )
