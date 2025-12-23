import math
import threading
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Iterable, Optional

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

_vader = None
_finbert = None
_lock = threading.Lock()

@dataclass(frozen=True)
class ScoredItem:
    source: str
    text: str
    score: float
    ts: Optional[datetime] = None


def _get_vader() -> SentimentIntensityAnalyzer:
    global _vader
    if _vader is None:
        _vader = SentimentIntensityAnalyzer()
    return _vader


def _get_finbert():
    global _finbert
    if _finbert is not None:
        return _finbert

    with _lock:
        if _finbert is not None:
            return _finbert

        from transformers import pipeline

        _finbert = pipeline(
            "sentiment-analysis",
            model="ProsusAI/finbert",
            tokenizer="ProsusAI/finbert",
        )
        return _finbert


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
    clf = _get_finbert()
    out = clf(texts, truncation=True)

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


def compute_confidence(scores: list[float], has_news: bool, has_reddit: bool) -> float:
    n = len(scores)
    if n == 0:
        return 0.0

    mean = sum(scores) / n
    var = sum((s - mean) ** 2 for s in scores) / n
    std = math.sqrt(var)

    mix_bonus = 0.10 if (has_news and has_reddit) else 0.0
    volume = math.log(1 + n)
    agreement = max(0.0, 1.0 - std)

    raw = 0.55 * volume + 1.25 * agreement + mix_bonus
    conf = 1.0 / (1.0 + math.exp(-raw))  # sigmoid
    return float(max(0.0, min(1.0, conf)))


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

    fin_texts = [t[0]["text"] for t in top]
    fin_scores = finbert_score(fin_texts)

    fin_map = {id(top[i][0]): fin_scores[i] for i in range(len(top))}

    scored: list[ScoredItem] = []
    for it, vs in vader_scored:
        fb = fin_map.get(id(it))
        final = blend(vs, fb)
        w = _age_weight(it.get("ts"))
        scored.append(
            ScoredItem(
                source=it["source"],
                text=it["text"],
                score=round(final * w, 4),
                ts=it.get("ts"),
            )
        )

    return scored