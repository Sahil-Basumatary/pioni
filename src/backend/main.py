from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, Optional
from newsapi import NewsApiClient
from textblob import TextBlob
import os
import praw
from fastapi.middleware.cors import CORSMiddleware
import logging
import random
from fastapi.responses import JSONResponse


class SentimentResponse(BaseModel):
    ticker: str
    sentiment: float
    sources: Dict[str, float]
    confidence: float

def fetch_news_sentiment(ticker: str):
    api_key = os.getenv("NEWS_API_KEY")

    # return mock score for now
    if not api_key:
        print("NEWS_API_KEY not found. Using a mock news sentiment for now")
        return round(random.uniform(-1, 1), 2)

    newsapi = NewsApiClient(api_key=api_key)
    query = f"{ticker} stock OR shares OR earnings"
    articles = newsapi.get_everything(q=query, language='en', page_size=10)['articles']

    sentiments = [TextBlob(article['title']).sentiment.polarity for article in articles]
    return round(sum(sentiments) / len(sentiments), 2) if sentiments else None

def fetch_reddit_sentiment(ticker: str):
    client_id = os.getenv("REDDIT_CLIENT_ID")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET")

    # Mock for development if no API keys
    if not client_id or not client_secret:
        print("Reddit API credentials not found. Using mock Reddit sentiment.")
        return round(random.uniform(-1, 1), 2)

    reddit = praw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        user_agent="pioni_by_u/AquaBzy"
    )

    subreddits = ["stocks", "wallstreetbets", "investing"]
    sentiments = []

    for sub in subreddits:
        posts = reddit.subreddit(sub).search(
            query=ticker,
            sort="top",
            limit=10
        )
        for post in posts:
            sentiments.append(TextBlob(post.title).sentiment.polarity)

    return round(sum(sentiments) / len(sentiments), 2) if sentiments else None

app = FastAPI(title="Pioni API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "running"}


@app.get("/sentiment/{ticker}", response_model=SentimentResponse)
def get_sentiment(ticker: str):
    news_score = fetch_news_sentiment(ticker)
    reddit_score = fetch_reddit_sentiment(ticker)

    sources = {}
    if news_score is not None:
        sources["newsapi"] = news_score
    if reddit_score is not None:
        sources["reddit"] = reddit_score

    if not sources:
        return {"ticker": ticker.upper(), "error": "No sentiment data found"}

    combined_score = round(sum(sources.values()) / len(sources), 2)

    return SentimentResponse(
        ticker=ticker.upper(),
        sentiment=combined_score,
        sources=sources,
        confidence=round(abs(combined_score), 2)
    )