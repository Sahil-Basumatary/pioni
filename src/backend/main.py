import logging
import asyncio
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
import httpx
from backend.api.routes import router
from backend.core.middleware import attach_request_id
from backend.core.logging import setup_logging
from backend.settings import cors_origins, is_mock_mode, prewarm_enabled, prewarm_tickers
from backend.core.ratelimit import rate_limit_middleware

setup_logging()
logger = logging.getLogger(__name__)


async def _warm_cache() -> None:
    await asyncio.sleep(3)

    tickers = prewarm_tickers()
    base_url = "http://127.0.0.1:8000"

    async with httpx.AsyncClient(base_url=base_url, timeout=60.0) as client:
        for attempt in range(5):
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
    if prewarm_enabled() and not is_mock_mode():
        asyncio.create_task(_warm_cache())
    yield


app = FastAPI(title="Pioni API", version="0.3.0", lifespan=lifespan)

app.middleware("http")(attach_request_id)

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