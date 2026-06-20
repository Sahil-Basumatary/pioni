import os
import logging
import asyncio
from typing import Dict
from datetime import datetime, timezone
from fastapi import Request
from sentiment.settings import is_mock_mode
from common import raise_api_error, TTLCache
from sentiment.assets import resolve_asset
from sentiment.publisher import publish_sentiment_update
from sentiment.scoring import (
    score_items,
    compute_confidence_details,
    FinbertUnavailable,
)
from sentiment.sources import ago, fetch_news_items, fetch_reddit_items, fetch_x_items, iso

SOURCE_LABEL = {"news": "newsapi", "reddit": "reddit", "x": "x"}

MOCK_DATA = {
    "TSLA": {"asset_class": "equity", "sentiment": 0.3, "sources": {"mock": 0.3}, "confidence": 0.5},
    "AAPL": {"asset_class": "equity", "sentiment": -0.1, "sources": {"mock": -0.1}, "confidence": 0.5},
    "BTC": {"asset_class": "crypto", "sentiment": 0.42, "sources": {"mock_crypto": 0.42}, "confidence": 0.62},
    "ETH": {"asset_class": "crypto", "sentiment": 0.25, "sources": {"mock_crypto": 0.25}, "confidence": 0.58},
    "SOL": {"asset_class": "crypto", "sentiment": -0.18, "sources": {"mock_crypto": -0.18}, "confidence": 0.54},
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

async def get_sentiment(ticker: str, request: Request):
    asset = resolve_asset(ticker)
    ticker = asset.ticker
    logging.info("Request received", extra={"ticker": ticker, "asset_class": asset.asset_class})
    if is_mock_mode():
        mock = MOCK_DATA.get(ticker)
        if not mock:
            raise_api_error(request, 404, "INVALID_TICKER", "We couldn't find that ticker in the mock dataset.")
        now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        mock_payload = {"ticker": ticker, **mock, "highlights": []}
        mock_payload["n_news"] = 0
        mock_payload["n_reddit"] = 0
        mock_payload["n_x"] = 0
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
            "n_x": 0,
        }
        mock_payload["evidence"] = []
        mock_payload["coverage_window"] = {"start": None, "end": None}
        mock_payload["feed"] = []
        return mock_payload, "MOCK"
    cache_key = f"sentiment:{ticker}"

    async def compute():
        results = await asyncio.gather(
            asyncio.to_thread(fetch_news_items, asset),
            asyncio.to_thread(fetch_reddit_items, asset),
            asyncio.to_thread(fetch_x_items, asset),
            return_exceptions=True,
        )
        news_items = results[0] if not isinstance(results[0], Exception) else []
        reddit_items = results[1] if not isinstance(results[1], Exception) else []
        x_items = results[2] if not isinstance(results[2], Exception) else []
        if isinstance(results[0], Exception):
            logging.warning("NewsAPI fetch failed", extra={"ticker": ticker, "error": str(results[0])})
        if isinstance(results[1], Exception):
            logging.warning("Reddit fetch failed", extra={"ticker": ticker, "error": str(results[1])})
        if isinstance(results[2], Exception):
            logging.warning("X API fetch failed", extra={"ticker": ticker, "error": str(results[2])})
        if not news_items and not reddit_items and not x_items:
            raise_api_error(request, 404, "NO_DATA", f"OOPS! No sentiment data found for {ticker}.")
        try:
            scored = await score_items([*news_items, *reddit_items, *x_items], finbert_top_n=12)
        except FinbertUnavailable as e:
            raise_api_error(request, 503, "FINBERT_UNAVAILABLE", str(e))
        scores = [s.score for s in scored]
        combined_score = round(sum(scores) / len(scores), 4) if scores else 0.0
        if combined_score == 0:
            raise_api_error(request, 422, "ZERO_SENTIMENT", f"Sentiment for {ticker} is exactly neutral based on recent data.")
        news_scores = [s.score for s in scored if s.source == "news"]
        reddit_scores = [s.score for s in scored if s.source == "reddit"]
        x_scores = [s.score for s in scored if s.source == "x"]
        sources: Dict[str, float] = {}
        if news_scores:
            sources["newsapi"] = round(sum(news_scores) / len(news_scores), 4)
        if reddit_scores:
            sources["reddit"] = round(sum(reddit_scores) / len(reddit_scores), 4)
        if x_scores:
            sources["x"] = round(sum(x_scores) / len(x_scores), 4)
        confidence_raw, drivers = compute_confidence_details(
            scores,
            has_news=bool(news_scores),
            has_reddit=bool(reddit_scores),
            has_x=bool(x_scores),
        )
        confidence = round(float(confidence_raw), 4)
        drivers["n_news"] = int(len(news_scores))
        drivers["n_reddit"] = int(len(reddit_scores))
        drivers["n_x"] = int(len(x_scores))
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
                "published_at": iso(s.ts),
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
            "start": iso(min(ts_all)) if ts_all else None,
            "end": iso(max(ts_all)) if ts_all else None,
        }
        feed_items = sorted(
            scored,
            key=lambda s: s.ts or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True,
        )[:12]
        feed = [
            {
                "id": s.item_id,
                "type": s.source,
                "title": s.text,
                "source": s.provider or SOURCE_LABEL.get(s.source, s.source),
                "score": round(float(s.score), 2),
                "ago": ago(s.ts),
            }
            for s in feed_items
        ]
        payload = {
            "ticker": ticker,
            "asset_class": asset.asset_class,
            "sentiment": combined_score,
            "sources": sources,
            "confidence": confidence,
            "highlights": highlights,
            "n_news": len(news_scores),
            "n_reddit": len(reddit_scores),
            "n_x": len(x_scores),
            "computed_at": computed_at,
            "confidence_drivers": drivers,
            "evidence": evidence,
            "coverage_window": window,
            "feed": feed,
        }
        await publish_sentiment_update(payload)
        return payload

    return await _cache.get_or_compute_swr(
        cache_key,
        ttl_seconds=CACHE_TTL_SECONDS,
        stale_seconds=CACHE_STALE_SECONDS,
        compute=compute,
    )

