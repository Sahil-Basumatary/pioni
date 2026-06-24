import logging
import httpx
from fastapi import APIRouter, Request, Response, HTTPException
from fastapi.responses import JSONResponse
from gateway.settings import sentiment_service_url

logger = logging.getLogger(__name__)
router = APIRouter()
_http_client: httpx.AsyncClient | None = None

async def get_http_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None:
        _http_client = httpx.AsyncClient(
            base_url=sentiment_service_url(),
            timeout=30.0,
        )
    return _http_client

async def close_http_client() -> None:
    global _http_client
    if _http_client:
        await _http_client.aclose()
        _http_client = None

async def _proxy_to_sentiment(path: str, response: Response) -> dict:
    client = await get_http_client()
    try:
        resp = await client.get(path)
        for header in ("X-Cache", "X-Mode"):
            if header in resp.headers:
                response.headers[header] = resp.headers[header]
        if resp.status_code >= 400:
            raise HTTPException(status_code=resp.status_code, detail=resp.json())
        return resp.json()
    except httpx.RequestError as e:
        logger.error(f"sentiment service unreachable: {e}")
        raise HTTPException(status_code=503, detail={"error": "SERVICE_UNAVAILABLE", "message": "Sentiment service unreachable"}) from None

@router.get("/health")
def health_check():
    return {"status": "ok"}

@router.get("/health/live")
def health_live():
    return {"status": "ok"}

@router.get("/health/ready")
async def health_ready():
    client = await get_http_client()
    try:
        resp = await client.get("/health/ready")
        return JSONResponse(content=resp.json(), status_code=resp.status_code)
    except httpx.RequestError:
        return JSONResponse(content={"status": "degraded", "sentiment": False}, status_code=503)

@router.get("/sentiment/{ticker}")
async def sentiment(ticker: str, request: Request, response: Response):
    return await _proxy_to_sentiment(f"/analyze/{ticker}", response)

@router.get("/sentiment/history/{ticker}")
async def sentiment_history(ticker: str, request: Request, response: Response):
    return await _proxy_to_sentiment(f"/history/{ticker}", response)

@router.get("/sentiment/signals/{ticker}")
async def sentiment_signals(ticker: str, request: Request, response: Response):
    return await _proxy_to_sentiment(f"/signals/{ticker}", response)

@router.get("/sentiment/feed/{ticker}")
async def sentiment_feed(ticker: str, request: Request, response: Response):
    return await _proxy_to_sentiment(f"/feed/{ticker}", response)
