from fastapi import APIRouter, Request, Response
from pydantic import BaseModel
from typing import Dict, List, Optional
from backend.services.sentiment import get_sentiment
from backend.services.history import get_history
from backend.services.feed import get_feed
from backend.settings import is_mock_mode

router = APIRouter()

class HighlightItem(BaseModel):
    source: str
    text: str
    score: float

class ConfidenceDrivers(BaseModel):
    n: int
    mean: float
    std: float
    volume: float
    agreement: float
    strength: float
    mix: float
    n_news: int
    n_reddit: int

class EvidenceItem(BaseModel):
    source: str
    id: Optional[str] = None
    url: Optional[str] = None
    text: str
    score: float
    published_at: Optional[str] = None
    retrieved_at: Optional[str] = None
    vader: Optional[float] = None
    finbert: Optional[float] = None
    blended: Optional[float] = None
    weight: Optional[float] = None

class CoverageWindow(BaseModel):
    start: Optional[str] = None
    end: Optional[str] = None

class SentimentResponse(BaseModel):
    ticker: str
    sentiment: float
    sources: Dict[str, float]
    confidence: float
    highlights: Optional[List[HighlightItem]] = None
    n_news: int
    n_reddit: int
    computed_at: str
    confidence_drivers: ConfidenceDrivers
    evidence: Optional[List[EvidenceItem]] = None
    coverage_window: Optional[CoverageWindow] = None

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
    response.headers["X-Mode"] = "MOCK" if cache_status == "MOCK" else "LIVE"
    return payload

@router.get("/sentiment/history/{ticker}")
async def sentiment_history(ticker: str, request: Request, response: Response):
    payload, cache_status = await get_history(ticker, request)
    response.headers["X-Cache"] = cache_status
    response.headers["X-Mode"] = "MOCK" if cache_status == "MOCK" else "LIVE"
    return payload

@router.get("/sentiment/feed/{ticker}", response_model=FeedResponse)
async def sentiment_feed(ticker: str, request: Request, response: Response):
    payload, cache_status = await get_feed(ticker, request)
    response.headers["X-Cache"] = cache_status
    response.headers["X-Mode"] = "MOCK" if is_mock_mode() else "LIVE"
    return payload