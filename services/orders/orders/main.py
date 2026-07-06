import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy import text
import redis.asyncio as aioredis
from common import (
    setup_logging,
    RequestIdMiddleware,
    get_session_factory,
    dispose_engine,
    RabbitMQManager,
    instrument_app,
    instrument_app_tracing,
)
import orders.settings as settings
from orders.routes import router as orders_router
from orders.service import init_order_service

setup_logging()
logger = logging.getLogger(__name__)

_rmq: RabbitMQManager | None = None
_redis: aioredis.Redis | None = None


async def _init_rabbitmq() -> RabbitMQManager:
    global _rmq
    url = settings.rabbitmq_url()
    _rmq = RabbitMQManager(url)
    await _rmq.connect()
    return _rmq


async def _close_rabbitmq() -> None:
    global _rmq
    if _rmq:
        await _rmq.close()
        _rmq = None


async def _init_redis() -> aioredis.Redis | None:
    global _redis
    url = settings.redis_url()
    if not url:
        logger.info("REDIS_URL not set, order status streaming disabled")
        return None
    try:
        _redis = aioredis.from_url(url, decode_responses=True)
        await _redis.ping()
        logger.info("redis connected for order status pub/sub")
        return _redis
    except Exception:
        logger.warning("redis connection failed, order status streaming disabled")
        _redis = None
        return None


async def _close_redis() -> None:
    global _redis
    if _redis:
        await _redis.aclose()
        _redis = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    factory = get_session_factory()
    rmq = await _init_rabbitmq()
    redis_conn = await _init_redis()
    svc = init_order_service(rmq, redis_conn)
    async with factory() as session:
        restored = await svc.restore_books(session)
        await session.commit()
    logger.info("orders service started", extra={"restored_orders": restored})
    yield
    await _close_redis()
    await _close_rabbitmq()
    await dispose_engine()
    logger.info("orders service stopped")

app = FastAPI(title="Pioni Orders Service", version="0.1.0", lifespan=lifespan)

instrument_app(app, "orders")
instrument_app_tracing(app, "orders")

app.add_middleware(RequestIdMiddleware)
app.include_router(orders_router)


@app.get("/health")
async def health():
    return JSONResponse({"status": "healthy", "service": "orders"})


@app.get("/health/live")
async def liveness():
    return JSONResponse({"status": "alive"})


@app.get("/health/ready")
async def readiness():
    try:
        factory = get_session_factory()
        async with factory() as session:
            await session.execute(text("SELECT 1"))
        ready = {"db": True, "rabbitmq": _rmq is not None and _rmq.connected}
        return JSONResponse({"status": "ready", "checks": ready})
    except Exception:
        logger.exception("readiness check failed")
        return JSONResponse({"status": "not_ready"}, status_code=503)

