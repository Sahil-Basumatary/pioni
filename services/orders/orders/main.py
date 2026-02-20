import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy import text
from common import setup_logging, attach_request_id, get_session_factory, dispose_engine
import orders.settings  # noqa: F401 — triggers dotenv load before anything reads env

setup_logging()
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    get_session_factory()
    logger.info("orders service started")
    yield
    await dispose_engine()
    logger.info("orders service stopped")

app = FastAPI(title="Pioni Orders Service", version="0.1.0", lifespan=lifespan)

app.middleware("http")(attach_request_id)

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
        return JSONResponse({"status": "ready"})
    except Exception:
        logger.exception("readiness check failed")
        return JSONResponse({"status": "not_ready"}, status_code=503)

