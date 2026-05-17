import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy import text
from common import (
    setup_logging,
    attach_request_id,
    get_session_factory,
    dispose_engine,
    RabbitMQManager,
)
import portfolio.settings  # noqa: F401 — triggers dotenv load before anything reads env
from portfolio.consumer import TradeConsumer
from portfolio.routes import router as portfolio_router

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


@asynccontextmanager
async def lifespan(app: FastAPI):
    factory = get_session_factory()
    rmq = RabbitMQManager()
    consumer = TradeConsumer(rmq, factory)
    consumer_task = asyncio.create_task(_run_consumer(rmq, consumer))
    app.state.rmq = rmq
    app.state.consumer = consumer
    app.state.consumer_task = consumer_task
    logger.info("portfolio service started")
    yield
    consumer_task.cancel()
    try:
        await consumer_task
    except asyncio.CancelledError:
        pass
    await rmq.close()
    await dispose_engine()
    logger.info("portfolio service stopped")


app = FastAPI(title="Pioni Portfolio Service", version="0.1.0", lifespan=lifespan)

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
