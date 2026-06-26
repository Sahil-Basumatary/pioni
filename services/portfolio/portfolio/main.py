import asyncio
import logging
from contextlib import asynccontextmanager
import redis.asyncio as aioredis
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy import text
from common import (
    setup_logging,
    attach_request_id,
    get_session_factory,
    dispose_engine,
    MarketSubscriber,
    RabbitMQManager,
    instrument_app,
)
import portfolio.settings  # noqa: F401 — triggers dotenv load before anything reads env
from portfolio.consumer import TradeConsumer
from portfolio.price_cache import PriceCache
from portfolio.routes import router as portfolio_router
from portfolio.settings import redis_url

setup_logging()
logger = logging.getLogger(__name__)


async def _run_consumer(rmq: RabbitMQManager, consumer: TradeConsumer) -> None:
    # Detached so lifespan can yield even if RabbitMQ is briefly unreachable.
    # connect() retries forever internally; a transient broker outage shouldn't crash the API.
    try:
        await rmq.connect()
        await consumer.start()
    except asyncio.CancelledError:
        raise
    except Exception:
        logger.exception("trade consumer failed to start")


async def _init_redis(app: FastAPI) -> aioredis.Redis | None:
    # Single Redis client shared by the price subscriber (uses .pubsub() for sub-connections)
    # and by the trade consumer for publishing portfolio update events. Centralizing the
    # client means one connection pool, one lifecycle to manage on shutdown.
    url = redis_url()
    if not url:
        logger.info("redis not configured, pricing and portfolio updates disabled")
        return None
    try:
        redis = aioredis.from_url(url, decode_responses=True)
        await redis.ping()
        app.state.redis = redis
        return redis
    except Exception:
        logger.exception("failed to connect to redis")
        return None


async def _start_price_subscriber(
    app: FastAPI, cache: PriceCache, redis: aioredis.Redis | None,
) -> None:
    if redis is None:
        return
    try:
        subscriber = MarketSubscriber(redis=redis, on_trade=cache.on_trade)
        await subscriber.start()
        app.state.price_subscriber = subscriber
        logger.info("price cache subscriber started")
    except Exception:
        logger.exception("failed to start price subscriber")


async def _shutdown_redis(app: FastAPI) -> None:
    sub = getattr(app.state, "price_subscriber", None)
    if sub:
        await sub.stop()
    redis = getattr(app.state, "redis", None)
    if redis:
        await redis.aclose()


@asynccontextmanager
async def lifespan(app: FastAPI):
    factory = get_session_factory()
    redis = await _init_redis(app)
    rmq = RabbitMQManager()
    consumer = TradeConsumer(rmq, factory, redis=redis)
    consumer_task = asyncio.create_task(_run_consumer(rmq, consumer))
    # Cache is always created so route handlers can call .get() unconditionally —
    # subscriber is best-effort and only starts if Redis is reachable.
    price_cache = PriceCache()
    app.state.price_cache = price_cache
    await _start_price_subscriber(app, price_cache, redis)
    app.state.rmq = rmq
    app.state.consumer = consumer
    app.state.consumer_task = consumer_task
    logger.info("portfolio service started")
    yield
    await _shutdown_redis(app)
    consumer_task.cancel()
    try:
        await consumer_task
    except asyncio.CancelledError:
        pass
    await rmq.close()
    await dispose_engine()
    logger.info("portfolio service stopped")


app = FastAPI(title="Pioni Portfolio Service", version="0.1.0", lifespan=lifespan)

instrument_app(app, "portfolio")

app.middleware("http")(attach_request_id)
app.include_router(portfolio_router)

@app.get("/health")
async def health():
    return JSONResponse({"status": "healthy", "service": "portfolio"})

@app.get("/health/live")
async def liveness():
    return JSONResponse({"status": "alive"})

@app.get("/health/ready")
async def readiness():
    try:
        factory = get_session_factory()
        async with factory() as session:
            await session.execute(text("SELECT 1"))
        return JSONResponse({"status": "ready"})
    except Exception:
        logger.exception("readiness check failed")
        return JSONResponse({"status": "not_ready"}, status_code=503)
