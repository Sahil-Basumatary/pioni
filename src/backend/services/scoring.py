import math
import threading
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Iterable, Optional
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import os
import time

_finbert_disabled = False
_vader = None
_finbert = None
_lock = threading.Lock()

@dataclass(frozen=True)
class ScoredItem:
    source: str               
    text: str
    score: float              
    ts: Optional[datetime] = None
    item_id: Optional[str] = None
    url: Optional[str] = None
    provider: Optional[str] = None
    vader: Optional[float] = None
    finbert: Optional[float] = None
    blended: Optional[float] = None
    weight: Optional[float] = None

def _get_vader() -> SentimentIntensityAnalyzer:
    global _vader
    if _vader is None:
        _vader = SentimentIntensityAnalyzer()
    return _vader

def _finbert_is_enabled() -> bool:
    global _finbert_disabled
    if _finbert_disabled:
        return False
    return os.getenv("FINBERT_ENABLED", "true").lower() == "true"

class FinbertUnavailable(Exception):
    pass

def _get_finbert():
    global _finbert
    if not _finbert_is_enabled():
        raise FinbertUnavailable("FinBERT disabled")

    if _finbert is not None:
        return _finbert

    with _lock:
        if _finbert is not None:
            return _finbert

        try:
            from transformers import pipeline
        except ModuleNotFoundError as e:
            raise FinbertUnavailable("transformers not installed") from e

        try:
            _finbert = pipeline(
                "sentiment-analysis",
                model="ProsusAI/finbert",
                tokenizer="ProsusAI/finbert",
            )
            return _finbert
        except Exception as e:
            raise FinbertUnavailable(f"FinBERT failed to load: {e}") from e


def _age_weight(ts: Optional[datetime], half_life_hours: float = 48.0) -> float:
    if ts is None:
        return 1.0

    now = datetime.now(timezone.utc)
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)

    age_hours = max(0.0, (now - ts).total_seconds() / 3600.0)
    lam = math.log(2) / half_life_hours
    return math.exp(-lam * age_hours)


def vader_score(text: str) -> float:
    v = _get_vader()
    return float(v.polarity_scores(text)["compound"])

def finbert_score(texts: list[str]) -> list[float]:
    global _finbert_disabled

    clf = _get_finbert()

    max_ms = int(os.getenv("FINBERT_MAX_LATENCY_MS", "9000"))
    t0 = time.perf_counter()
    out = clf(texts, truncation=True)
    elapsed_ms = (time.perf_counter() - t0) * 1000

    if elapsed_ms > max_ms:
        _finbert_disabled = True
        raise FinbertUnavailable(f"FinBERT too slow ({int(elapsed_ms)}ms > {max_ms}ms), auto-disabled")

    scores: list[float] = []
    for r in out:
        label = (r.get("label") or "").lower()
        prob = float(r.get("score") or 0.0)

        if "positive" in label:
            scores.append(prob)
        elif "negative" in label:
            scores.append(-prob)
        else:
            scores.append(0.0)

    return scores

def blend(vader: float, finbert: Optional[float]) -> float:
    if finbert is None:
        return vader
    return 0.35 * vader + 0.65 * finbert

def compute_confidence_details(
    scores: list[float],
    has_news: bool,
    has_reddit: bool,
) -> tuple[float, dict]:
    n = len(scores)
    if n == 0:
        drivers = {
            "n": 0,
            "mean": 0.0,
            "std": 0.0,
            "volume": 0.0,
            "agreement": 0.0,
            "strength": 0.0,
            "mix": 0.0,
        }
        return 0.0, drivers

    mean = sum(scores) / n
    var = sum((s - mean) ** 2 for s in scores) / n
    std = math.sqrt(var)
    volume = 1.0 - math.exp(-n / 12.0)
    agreement = math.exp(-2.5 * std)
    strength = min(1.0, abs(mean) * 1.8)
    mix = 1.0 if (has_news and has_reddit) else 0.85

    raw = (0.40 * volume) + (0.40 * agreement) + (0.20 * strength)
    conf = (0.05 + 0.90 * raw) * mix
    conf = float(max(0.0, min(1.0, conf)))

    drivers = {
        "n": int(n),
        "mean": round(float(mean), 4),
        "std": round(float(std), 4),
        "volume": round(float(volume), 4),
        "agreement": round(float(agreement), 4),
        "strength": round(float(strength), 4),
        "mix": round(float(mix), 4),
    }

    return conf, drivers

def compute_confidence(scores: list[float], has_news: bool, has_reddit: bool) -> float:
    conf, _ = compute_confidence_details(scores, has_news=has_news, has_reddit=has_reddit)
    return conf

def score_items(items: Iterable[dict], finbert_top_n: int = 12) -> list[ScoredItem]:
    items_list = list(items)
    if not items_list:
        return []

    vader_scored = []
    for it in items_list:
        text = it["text"]
        vs = vader_score(text)
        vader_scored.append((it, vs))

    vader_scored.sort(key=lambda t: abs(t[1]), reverse=True)
    top = vader_scored[:finbert_top_n]

    fin_map = {}
    try:
        fin_texts = [t[0]["text"] for t in top]
        fin_scores = finbert_score(fin_texts)
        fin_map = {id(top[i][0]): fin_scores[i] for i in range(len(top))}
    except FinbertUnavailable:
        if os.getenv("FINBERT_REQUIRED", "false").lower() == "true":
            raise
        fin_map = {}

    scored: list[ScoredItem] = []
    for it, vs in vader_scored:
        fb = fin_map.get(id(it))
        blended = blend(vs, fb)
        w = _age_weight(it.get("ts"))
        final = round(blended * w, 4)
        provider = it.get("provider") or ("newsapi" if it.get("source") == "news" else "reddit")

        scored.append(
            ScoredItem(
                source=it["source"],
                text=it["text"],
                score=final,
                ts=it.get("ts"),
                item_id=it.get("id") or it.get("item_id"),
                url=it.get("url"),
                provider=provider,
                vader=round(float(vs), 4),
                finbert=(round(float(fb), 4) if fb is not None else None),
                blended=round(float(blended), 4),
                weight=round(float(w), 4),
            )
        )

    return scored