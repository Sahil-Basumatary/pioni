import os
import logging
from typing import Dict
from datetime import datetime, timezone
from fastapi import Request
from newsapi import NewsApiClient
import praw
from backend.settings import is_mock_mode
from backend.core.errors import raise_api_error
from backend.services.scoring import (
    score_items,
    compute_confidence_details,
    compute_confidence,
    FinbertUnavailable,
)
from backend.core.cache import TTLCache
import hashlib

SOURCE_LABEL = {"news": "newsapi", "reddit": "reddit"}

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

_cache = TTLCache()
CACHE_TTL_SECONDS = int(os.getenv("SENTIMENT_CACHE_TTL_SECONDS", "300"))
CACHE_STALE_SECONDS = int(os.getenv("SENTIMENT_CACHE_STALE_SECONDS", "60"))

def _iso(dt: datetime | None) -> str | None:
    if not dt:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _stable_id(prefix: str, raw: str) -> str:
    h = hashlib.sha1(raw.encode("utf-8")).hexdigest()[:16]
    return f"{prefix}:{h}"

def fetch_news_items(ticker: str):
    api_key = os.getenv("NEWS_API_KEY")
    if not api_key:
        logging.warning("NEWS_API_KEY missing; returning no news items.")
        return []

    newsapi = NewsApiClient(api_key=api_key)
    query = f"{ticker} stock OR shares OR earnings"
    articles = newsapi.get_everything(q=query, language="en", page_size=20)["articles"]

    items = []
    for a in articles or []:
        title = a.get("title")
        if not title:
            continue

        url = a.get("url") or None
        ts = a.get("publishedAt")
        dt = None
        if ts:
            try:
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00")).astimezone(timezone.utc)
            except Exception:
                dt = None

        raw = url or f"{title}|{ts or ''}"
        item_id = _stable_id("newsapi", raw)

        items.append(
            {
                "source": "news",
                "provider": "newsapi",
                "id": item_id,
                "url": url,
                "text": title,
                "ts": dt,
            }
        )
    return items

def fetch_reddit_items(ticker: str):
    client_id = os.getenv("REDDIT_CLIENT_ID")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET")
    if not client_id or not client_secret:
        logging.warning("Reddit credentials missing; returning no reddit items.")
        return []

    reddit = praw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        user_agent="pioni_by_u/AquaBzy",
    )

    subreddits = ["stocks", "wallstreetbets", "investing"]
    items = []
    for sub in subreddits:
        posts = reddit.subreddit(sub).search(query=ticker, sort="top", limit=15)
        for p in posts:
            title = getattr(p, "title", None)
            if not title:
                continue

            pid = getattr(p, "id", None)
            permalink = getattr(p, "permalink", None)
            url = f"https://www.reddit.com{permalink}" if permalink else None
            item_id = f"reddit:{pid}" if pid else _stable_id("reddit", f"{sub}|{title}")

            created = getattr(p, "created_utc", None)
            dt = datetime.fromtimestamp(created, tz=timezone.utc) if created else None

            items.append(
                {
                    "source": "reddit",
                    "provider": "reddit",
                    "id": item_id,
                    "url": url,
                    "text": title,
                    "ts": dt,
                }
            )
    return items

async def get_sentiment(ticker: str, request: Request):
    ticker = ticker.upper()
    logging.info(f"Request received for sentiment: {ticker}")

    if is_mock_mode():
        mock = MOCK_DATA.get(ticker)
        if not mock:
            raise_api_error(request, 404, "INVALID_TICKER", "We couldn't find that ticker in the mock dataset.")

        now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        mock_payload = {"ticker": ticker, **mock, "highlights": []}
        mock_payload["n_news"] = 0
        mock_payload["n_reddit"] = 0
        mock_payload["computed_at"] = now_iso
        mock_payload["confidence_drivers"] = {
            "n": 0,
            "mean": 0.0,
            "std": 0.0,
            "volume": 0.0,
            "agreement": 0.0,
            "strength": 0.0,
            "mix": 0.0,
            "n_news": 0,
            "n_reddit": 0,
        }
        mock_payload["evidence"] = []
        mock_payload["coverage_window"] = {"start": None, "end": None}
        return mock_payload, "MOCK"

    cache_key = f"sentiment:{ticker}"

    async def compute():
        news_items = fetch_news_items(ticker)
        reddit_items = fetch_reddit_items(ticker)

        if not news_items and reddit_items:
            raise_api_error(request, 422, "NO_NEWS", f"No recent news articles found for {ticker}.")
        if not reddit_items and news_items:
            raise_api_error(request, 422, "NO_REDDIT", f"No relevant Reddit mentions found for {ticker}.")
        if not news_items and not reddit_items:
            raise_api_error(request, 404, "NO_DATA", f"OOPS! No sentiment data found for {ticker}.")

        try:
            scored = score_items([*news_items, *reddit_items], finbert_top_n=12)
        except FinbertUnavailable as e:
            raise_api_error(request, 503, "FINBERT_UNAVAILABLE", str(e))

        scores = [s.score for s in scored]
        combined_score = round(sum(scores) / len(scores), 4) if scores else 0.0
        if combined_score == 0:
            raise_api_error(request, 422, "ZERO_SENTIMENT", f"Sentiment for {ticker} is exactly neutral based on recent data.")

        news_scores = [s.score for s in scored if s.source == "news"]
        reddit_scores = [s.score for s in scored if s.source == "reddit"]
        sources: Dict[str, float] = {}
        if news_scores:
            sources["newsapi"] = round(sum(news_scores) / len(news_scores), 4)
        if reddit_scores:
            sources["reddit"] = round(sum(reddit_scores) / len(reddit_scores), 4)

        confidence_raw, drivers = compute_confidence_details(
            scores,
            has_news=bool(news_scores),
            has_reddit=bool(reddit_scores),
        )
        confidence = round(float(confidence_raw), 4)
        drivers["n_news"] = int(len(news_scores))
        drivers["n_reddit"] = int(len(reddit_scores))
        computed_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        top_pos = sorted(scored, key=lambda s: s.score, reverse=True)[:2]
        top_neg = sorted(scored, key=lambda s: s.score)[:2]
        highlights = [
            *[
                {"source": SOURCE_LABEL.get(s.source, s.source), "text": s.text, "score": round(s.score, 4)}
                for s in top_pos if s.score > 0
            ],
            *[
                {"source": SOURCE_LABEL.get(s.source, s.source), "text": s.text, "score": round(s.score, 4)}
                for s in top_neg if s.score < 0
            ],
        ]
        evidence_sorted = sorted(scored, key=lambda s: abs(s.score), reverse=True)[:20]
        evidence = [
            {
                "source": s.provider or SOURCE_LABEL.get(s.source, s.source),
                "id": s.item_id,
                "url": s.url,
                "text": s.text,
                "score": round(float(s.score), 4),
                "published_at": _iso(s.ts),
                "retrieved_at": computed_at,
                "vader": s.vader,
                "finbert": s.finbert,
                "blended": s.blended,
                "weight": s.weight,
            }
            for s in evidence_sorted
        ]
        ts_all = [s.ts for s in scored if s.ts]
        window = {
            "start": _iso(min(ts_all)) if ts_all else None,
            "end": _iso(max(ts_all)) if ts_all else None,
        }

        return {
            "ticker": ticker,
            "sentiment": combined_score,
            "sources": sources,
            "confidence": confidence,
            "highlights": highlights,
            "n_news": len(news_scores),
            "n_reddit": len(reddit_scores),
            "computed_at": computed_at,
            "confidence_drivers": drivers,
            "evidence": evidence,
            "coverage_window": window,
        }

    return await _cache.get_or_compute_swr(
        cache_key,
        ttl_seconds=CACHE_TTL_SECONDS,
        stale_seconds=CACHE_STALE_SECONDS,
        compute=compute,
    )
    
    