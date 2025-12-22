from fastapi import APIRouter, Request
from backend.services.sentiment import get_sentiment
from backend.services.history import get_history
from backend.services.feed import get_feed

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "running"}

@router.get("/sentiment/{ticker}")
def sentiment(ticker: str, request: Request):
    return get_sentiment(ticker, request)

@router.get("/sentiment/history/{ticker}")
async def sentiment_history(ticker: str):
    return await get_history(ticker)

@router.get("/sentiment/feed/{ticker}")
async def sentiment_feed(ticker: str):
    return await get_feed(ticker)