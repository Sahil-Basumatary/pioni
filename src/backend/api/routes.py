from fastapi import APIRouter, Request, Response
from pydantic import BaseModel
from typing import Dict, List, Optional

from backend.services.sentiment import get_sentiment
from backend.services.history import get_history
from backend.services.feed import get_feed

router = APIRouter()

class HighlightItem(BaseModel):
    source: str
    text: str
    score: float

class SentimentResponse(BaseModel):
    ticker: str
    sentiment: float
    sources: Dict[str, float]
    confidence: float
    highlights: Optional[List[HighlightItem]] = None

class FeedItem(BaseModel):
    id: str
    type: str
    title: str
    source: str
    score: float
    ago: str


class FeedResponse(BaseModel):
    ticker: str
    items: List[FeedItem]


@router.get("/health")
def health_check():
    return {"status": "running"}

@router.get("/sentiment/{ticker}", response_model=SentimentResponse)
async def sentiment(ticker: str, request: Request, response: Response):
    payload, cache_status = await get_sentiment(ticker, request)
    response.headers["X-Cache"] = cache_status
    return payload


@router.get("/sentiment/history/{ticker}")
async def sentiment_history(ticker: str):
    return await get_history(ticker)


@router.get("/sentiment/feed/{ticker}", response_model=FeedResponse)
async def sentiment_feed(ticker: str):
    return await get_feed(ticker)

