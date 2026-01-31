import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from common import setup_logging, attach_request_id, init_redis_pool, close_redis_pool
from sentiment.routes import router

setup_logging()
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_redis_pool()
    logger.info("sentiment service started")
    yield
    await close_redis_pool()
    logger.info("sentiment service stopped")

app = FastAPI(title="Pioni Sentiment Service", version="0.3.0", lifespan=lifespan)

app.middleware("http")(attach_request_id)

app.include_router(router)

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

