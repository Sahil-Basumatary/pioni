import os
import random
from typing import Dict
import logging
from fastapi import Request
from newsapi import NewsApiClient
from textblob import TextBlob
import praw

from backend.settings import is_mock_mode
from backend.core.errors import raise_api_error

MOCK_DATA = {
    "TSLA": {"sentiment": 0.3, "sources": {"mock": 0.3}, "confidence": 0.5},
    "AAPL": {"sentiment": -0.1, "sources": {"mock": -0.1}, "confidence": 0.5},
}

MOCK_ERROR_TICKERS = {
    "NONEWS": ("NO_NEWS", 422, "No news articles found for this ticker in mock mode."),
    "NORED": ("NO_REDDIT", 422, "No Reddit mentions found for this ticker in mock mode."),
    "TOOFEW": ("TOO_FEW_POSTS", 424, "Not enough recent posts to calculate sentiment in mock mode."),
    "ZEROSENT": ("ZERO_SENTIMENT", 422, "Mock sentiment ended up exactly neutral for this ticker."),
    "LIMIT": ("RATE_LIMIT", 429, "Upstream data provider rate-limited us (simulated in mock mode)."),
}

def fetch_news_sentiment(ticker: str):
    api_key = os.getenv("NEWS_API_KEY")
    if not api_key:
        logging.warning("NEWS_API_KEY missing; falling back to mock news sentiment.")
        return round(random.uniform(-1, 1), 2)

    newsapi = NewsApiClient(api_key=api_key)
    query = f"{ticker} stock OR shares OR earnings"
    articles = newsapi.get_everything(q=query, language="en", page_size=10)["articles"]
    if not articles:
        return None

    sentiments = [TextBlob(a["title"]).sentiment.polarity for a in articles]
    return round(sum(sentiments) / len(sentiments), 2) if sentiments else None

def fetch_reddit_sentiment(ticker: str):
    client_id = os.getenv("REDDIT_CLIENT_ID")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET")
    if not client_id or not client_secret:
        logging.warning("Reddit credentials missing; falling back to mock reddit sentiment.")
        return round(random.uniform(-1, 1), 2)

    reddit = praw.Reddit(client_id=client_id, client_secret=client_secret, user_agent="pioni_by_u/AquaBzy")
    subreddits = ["stocks", "wallstreetbets", "investing"]

    sentiments = []
    for sub in subreddits:
        posts = reddit.subreddit(sub).search(query=ticker, sort="top", limit=10)
        for post in posts:
            sentiments.append(TextBlob(post.title).sentiment.polarity)

    return round(sum(sentiments) / len(sentiments), 2) if sentiments else None

def get_sentiment(ticker: str, request: Request):
    ticker = ticker.upper()
    logging.info(f"Request received for sentiment: {ticker}")

    if is_mock_mode():
        if ticker in MOCK_ERROR_TICKERS:
            error_code, status_code, msg = MOCK_ERROR_TICKERS[ticker]
            raise_api_error(request, status_code=status_code, error_code=error_code, message=msg)

        mock = MOCK_DATA.get(ticker)
        if not mock:
            raise_api_error(request, status_code=404, error_code="INVALID_TICKER", message="We couldn't find that ticker in the mock dataset.")

        return {"ticker": ticker, **mock}

    news_score = fetch_news_sentiment(ticker)
    reddit_score = fetch_reddit_sentiment(ticker)

    if news_score is None and reddit_score is not None:
        raise_api_error(request, status_code=422, error_code="NO_NEWS", message=f"No recent news articles found for {ticker}.")
    if reddit_score is None and news_score is not None:
        raise_api_error(request, status_code=422, error_code="NO_REDDIT", message=f"No relevant Reddit mentions found for {ticker}.")

    sources: Dict[str, float] = {}
    if news_score is not None:
        sources["newsapi"] = news_score
    if reddit_score is not None:
        sources["reddit"] = reddit_score

    if not sources:
        raise_api_error(request, status_code=404, error_code="NO_DATA", message=f"OOPS! No sentiment data found for {ticker}.")

    combined_score = round(sum(sources.values()) / len(sources), 2)
    if combined_score == 0:
        raise_api_error(request, status_code=422, error_code="ZERO_SENTIMENT", message=f"Sentiment for {ticker} is exactly neutral based on recent data.")

    return {
        "ticker": ticker,
        "sentiment": combined_score,
        "sources": sources,
        "confidence": round(abs(combined_score), 2),
    }