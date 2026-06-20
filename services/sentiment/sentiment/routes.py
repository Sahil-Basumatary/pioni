from fastapi import APIRouter, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, List, Optional
from sentiment.analysis import get_sentiment
from sentiment.history import get_history
from sentiment.feed import get_feed
from sentiment.health import get_health_status
from sentiment.settings import is_mock_mode

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
    n_x: int

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

class FeedItem(BaseModel):
    id: str
    type: str
    title: str
    source: str
    score: float
    ago: str

class SentimentResponse(BaseModel):
    ticker: str
    asset_class: str
    sentiment: float
    sources: Dict[str, float]
    confidence: float
    highlights: Optional[List[HighlightItem]] = None
    n_news: int
    n_reddit: int
    n_x: int
    computed_at: str
    confidence_drivers: ConfidenceDrivers
    evidence: Optional[List[EvidenceItem]] = None
    coverage_window: Optional[CoverageWindow] = None
    feed: Optional[List[FeedItem]] = None

class FeedResponse(BaseModel):
    ticker: str
    asset_class: str
    items: List[FeedItem]

class HistoryPoint(BaseModel):
    date: str
    score: float

class HistoryResponse(BaseModel):
    ticker: str
    history: List[HistoryPoint]

@router.get("/health")
def health_check():
    return {"status": "ok"}

@router.get("/health/live")
def health_live():
    return {"status": "ok"}

@router.get("/health/ready")
async def health_ready():
    body, status_code = await get_health_status()
    return JSONResponse(content=body, status_code=status_code)

@router.get("/analyze/{ticker}", response_model=SentimentResponse)
async def analyze(ticker: str, request: Request, response: Response):
    payload, cache_status = await get_sentiment(ticker, request)
    response.headers["X-Cache"] = cache_status
    response.headers["X-Mode"] = "MOCK" if cache_status == "MOCK" else "LIVE"
    return payload

@router.get("/history/{ticker}", response_model=HistoryResponse)
async def history(ticker: str, request: Request, response: Response):
    payload, cache_status = await get_history(ticker, request)
    response.headers["X-Cache"] = cache_status
    response.headers["X-Mode"] = "MOCK" if cache_status == "MOCK" else "LIVE"
    return payload

@router.get("/feed/{ticker}", response_model=FeedResponse)
async def feed(ticker: str, request: Request, response: Response):
    payload, cache_status = await get_feed(ticker, request)
    response.headers["X-Cache"] = cache_status
    response.headers["X-Mode"] = "MOCK" if is_mock_mode() else "LIVE"
    return payload

