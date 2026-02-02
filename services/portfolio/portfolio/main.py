import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from common import setup_logging, attach_request_id

setup_logging()
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("portfolio service started")
    yield
    logger.info("portfolio service stopped")

app = FastAPI(title="Pioni Portfolio Service", version="0.1.0", lifespan=lifespan)

app.middleware("http")(attach_request_id)

@app.get("/health")
async def health():
    return JSONResponse({"status": "healthy", "service": "portfolio"})

@app.get("/health/live")
async def liveness():
    return JSONResponse({"status": "alive"})

@app.get("/health/ready")
async def readiness():
    return JSONResponse({"status": "ready"})

