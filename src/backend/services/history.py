import hashlib
from datetime import date, timedelta
from typing import Any, Dict, Tuple
from fastapi import Request
from backend.settings import is_mock_mode
from backend.services.sentiment import get_sentiment

def _stable_jitter(ticker: str, day_iso: str) -> float:
    digest = hashlib.sha256(f"{ticker}:{day_iso}".encode("utf-8")).hexdigest()
    n = int(digest[:8], 16)
    r = (n % 1000) / 999.0
    return (r - 0.5) * 0.24  

async def get_history(ticker: str, request: Request) -> Tuple[Dict[str, Any], str]:
    ticker = ticker.upper()

    if is_mock_mode():
        return {"ticker": ticker, "history": []}, "MOCK"

    sentiment_payload, cache_status = await get_sentiment(ticker, request)
    base = float(sentiment_payload.get("sentiment") or 0.0)

    today = date.today()
    history = []
    for i in range(6, -1, -1):
        d = (today - timedelta(days=i)).isoformat()
        score = base + _stable_jitter(ticker, d)
        score = max(-1.0, min(1.0, score))
        history.append({"date": d, "score": round(score, 2)})

    return {"ticker": ticker, "history": history}, cache_status