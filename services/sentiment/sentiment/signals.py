import os
from datetime import datetime, timezone
from typing import Any, Tuple

from fastapi import Request

from sentiment.analysis import get_sentiment
from sentiment.history import get_history

SPIKE_THRESHOLD = float(os.getenv("SENTIMENT_SPIKE_THRESHOLD", "0.18"))
STRONG_SENTIMENT_THRESHOLD = float(os.getenv("SENTIMENT_STRONG_THRESHOLD", "0.35"))
MIN_SIGNAL_CONFIDENCE = float(os.getenv("SENTIMENT_MIN_SIGNAL_CONFIDENCE", "0.45"))


def _signal_action(score: float, delta: float, confidence: float) -> str:
    if confidence < MIN_SIGNAL_CONFIDENCE:
        return "WATCH"
    if delta >= SPIKE_THRESHOLD and score >= 0:
        return "BUY"
    if delta <= -SPIKE_THRESHOLD and score <= 0:
        return "SELL"
    if score >= STRONG_SENTIMENT_THRESHOLD:
        return "BULLISH_WATCH"
    if score <= -STRONG_SENTIMENT_THRESHOLD:
        return "BEARISH_WATCH"
    return "HOLD"


def _reason(action: str, score: float, delta: float, confidence: float) -> str:
    if action == "BUY":
        return "Positive sentiment is accelerating faster than the spike threshold."
    if action == "SELL":
        return "Negative sentiment is deteriorating faster than the spike threshold."
    if action == "BULLISH_WATCH":
        return "Sentiment is strongly positive, but the latest change is not a fresh spike."
    if action == "BEARISH_WATCH":
        return "Sentiment is strongly negative, but the latest change is not a fresh breakdown."
    if action == "WATCH":
        return "Confidence is too low for an actionable signal."
    return "No meaningful sentiment spike detected."


def build_signal(sentiment: dict[str, Any], history: list[dict[str, Any]]) -> dict[str, Any]:
    score = float(sentiment.get("sentiment") or 0.0)
    confidence = float(sentiment.get("confidence") or 0.0)
    previous = float(history[-2]["score"]) if len(history) >= 2 else score
    delta = round(score - previous, 4)
    action = _signal_action(score, delta, confidence)
    generated_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    return {
        "ticker": sentiment["ticker"],
        "asset_class": sentiment.get("asset_class", "unknown"),
        "action": action,
        "score": round(score, 4),
        "confidence": round(confidence, 4),
        "delta": delta,
        "threshold": SPIKE_THRESHOLD,
        "reason": _reason(action, score, delta, confidence),
        "generated_at": generated_at,
        "inputs": {
            "sentiment": round(score, 4),
            "previous_sentiment": round(previous, 4),
            "confidence": round(confidence, 4),
            "sources": sentiment.get("sources", {}),
        },
    }


async def get_signal(ticker: str, request: Request) -> Tuple[dict[str, Any], str]:
    sentiment_payload, sentiment_cache = await get_sentiment(ticker, request)
    history_payload, history_cache = await get_history(ticker, request)
    signal = build_signal(sentiment_payload, history_payload.get("history") or [])
    cache_status = sentiment_cache if sentiment_cache == history_cache else "MIXED"
    return signal, cache_status

