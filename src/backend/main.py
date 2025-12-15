from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional, List
from newsapi import NewsApiClient
from textblob import TextBlob
import os
import praw
from fastapi.middleware.cors import CORSMiddleware
import logging
from datetime import datetime, timedelta, timezone
import random
from dotenv import load_dotenv

load_dotenv()  # auto load environment variables
def is_mock_mode() -> bool:
    return os.getenv("MOCK", "true").lower() == "true"

MOCK_DATA = {
    "TSLA": {"sentiment": 0.3, "sources": {"mock": 0.3}, "confidence": 0.5},
    "AAPL": {"sentiment": -0.1, "sources": {"mock": -0.1}, "confidence": 0.5},
}

MOCK_ERROR_TICKERS = {
    
    "NONEWS": ("NO_NEWS", 422, "No news articles found for this ticker in mock mode."),
    
    "NORED": ("NO_REDDIT", 422, "No Reddit mentions found for this ticker in mock mode."),
   
    "TOOFEW": (
        "TOO_FEW_POSTS",
        424,
        "Not enough recent posts to calculate sentiment in mock mode.",
    ),
    
    "ZEROSENT": (
        "ZERO_SENTIMENT",
        422,
        "Mock sentiment ended up exactly neutral for this ticker.",
    ),

    "LIMIT": (
        "RATE_LIMIT",
        429,
        "Upstream data provider rate-limited us (simulated in mock mode).",
    ),
}

os.makedirs("logs", exist_ok=True)

logging.basicConfig(
    filename="logs/app.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)


class SentimentResponse(BaseModel):
    ticker: str
    sentiment: float
    sources: Dict[str, float]
    confidence: float

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


def raise_api_error(status_code: int, error_code: str, message: str) -> None:

    logging.warning(f"{error_code}: {message}")
    raise HTTPException(
        status_code=status_code,
        detail={"error": error_code, "message": message},
    )


def fetch_news_sentiment(ticker: str):
    api_key = os.getenv("NEWS_API_KEY")

    if not api_key:
        print("NEWS_API_KEY not found. Using a mock news sentiment for now")
        return round(random.uniform(-1, 1), 2)

    newsapi = NewsApiClient(api_key=api_key)
    query = f"{ticker} stock OR shares OR earnings"
    articles = newsapi.get_everything(q=query, language="en", page_size=10)["articles"]

    if not articles:
        return None

    sentiments = [TextBlob(article["title"]).sentiment.polarity for article in articles]
    return round(sum(sentiments) / len(sentiments), 2) if sentiments else None


def fetch_reddit_sentiment(ticker: str):
    client_id = os.getenv("REDDIT_CLIENT_ID")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET")

    if not client_id or not client_secret:
        print("Reddit API credentials not found. Using mock Reddit sentiment.")
        return round(random.uniform(-1, 1), 2)

    reddit = praw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        user_agent="pioni_by_u/AquaBzy",
    )

    subreddits = ["stocks", "wallstreetbets", "investing"]
    sentiments = []

    for sub in subreddits:
        posts = reddit.subreddit(sub).search(
            query=ticker,
            sort="top",
            limit=10,
        )
        for post in posts:
            sentiments.append(TextBlob(post.title).sentiment.polarity)

    return round(sum(sentiments) / len(sentiments), 2) if sentiments else None


app = FastAPI(title="Pioni API", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5175",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "running"}


@app.get("/sentiment/{ticker}", response_model=SentimentResponse)
def get_sentiment(ticker: str):
    ticker = ticker.upper()
    logging.info(f"Request received for sentiment: {ticker}")

    try:

        if is_mock_mode():
            
            if ticker in MOCK_ERROR_TICKERS:
                error_code, status_code, msg = MOCK_ERROR_TICKERS[ticker]
                raise_api_error(status_code=status_code, error_code=error_code, message=msg)

            mock = MOCK_DATA.get(ticker)
            if not mock:
                raise_api_error(
                    status_code=404,
                    error_code="INVALID_TICKER",
                    message="We couldn't find that ticker in the mock dataset.",
                )

            logging.info(f"Returning mock sentiment for {ticker}: {mock}")
            return SentimentResponse(
                ticker=ticker,
                sentiment=mock["sentiment"],
                sources=mock["sources"],
                confidence=mock["confidence"],
            )

        news_score = fetch_news_sentiment(ticker)
        reddit_score = fetch_reddit_sentiment(ticker)

        if news_score is None and reddit_score is not None:
            raise_api_error(
                status_code=422,
                error_code="NO_NEWS",
                message=f"No recent news articles found for {ticker}.",
            )

        if reddit_score is None and news_score is not None:
            raise_api_error(
                status_code=422,
                error_code="NO_REDDIT",
                message=f"No relevant Reddit mentions found for {ticker}.",
            )

        sources: Dict[str, float] = {}
        if news_score is not None:
            sources["newsapi"] = news_score
        if reddit_score is not None:
            sources["reddit"] = reddit_score

        if not sources:
            raise_api_error(
                status_code=404,
                error_code="NO_DATA",
                message=f"OOPS! No sentiment data found for {ticker}.",
            )

        combined_score = round(sum(sources.values()) / len(sources), 2)

        if combined_score == 0:
            raise_api_error(
                status_code=422,
                error_code="ZERO_SENTIMENT",
                message=f"Sentiment for {ticker} is exactly neutral based on recent data.",
            )

        logging.info(f"Sentiment calculated for {ticker}: {combined_score}")

        return SentimentResponse(
            ticker=ticker,
            sentiment=combined_score,
            sources=sources,
            confidence=round(abs(combined_score), 2),
        )

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error processing {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@app.get("/sentiment/history/{ticker}")
async def sentiment_history(ticker: str):

    history = []
    today = datetime.now(timezone.utc)

    for i in range(7):
        day = today - timedelta(days=i)
        history.append(
            {
                "date": day.strftime("%Y-%m-%d"),
                "score": round(random.uniform(-1, 1), 2),
            }
        )

    return {"ticker": ticker.upper(), "history": list(reversed(history))}

@app.get("/sentiment/feed/{ticker}", response_model=FeedResponse)
async def sentiment_feed(ticker: str):
    ticker = ticker.upper()

    items: List[Dict] = []

    # Simple mock feed for now 
    for i in range(3):
        minutes_ago = (i + 1) * 45
        ago_str = f"{minutes_ago} min ago" if minutes_ago < 180 else f"{minutes_ago // 60} h ago"
        items.append(
            {
                "id": f"news-{i}",
                "type": "news",
                "title": f"{ticker} mock news headline {i + 1}",
                "source": "Mock Newswire",
                "score": round(random.uniform(-1, 1), 2),
                "ago": ago_str,
            }
        )

    for i in range(2):
        minutes_ago = (i + 4) * 30
        ago_str = f"{minutes_ago} min ago" if minutes_ago < 180 else f"{minutes_ago // 60} h ago"
        items.append(
            {
                "id": f"reddit-{i}",
                "type": "reddit",
                "title": f"{ticker} mock Reddit thread {i + 1}",
                "source": "r/mockstocks",
                "score": round(random.uniform(-1, 1), 2),
                "ago": ago_str,
            }
        )

    # Dev-only for special tickers
    if ticker == "NONEWS":
        items = [i for i in items if i["type"] == "reddit"]
    elif ticker == "NORED":
        items = [i for i in items if i["type"] == "news"]
    elif ticker == "TOOFEW":
        items = items[:1]
    elif ticker == "ZEROSENT":
        for i in items:
            i["score"] = 0.0

    return FeedResponse(ticker=ticker, items=[FeedItem(**i) for i in items])
