import math
import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Iterable, Optional
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from huggingface_hub import InferenceClient
from huggingface_hub.errors import HfHubHTTPError
from tenacity import retry, stop_after_attempt, wait_exponential_jitter, retry_if_exception, RetryCallState
from sentiment.settings import hf_api_token, finbert_required

logger = logging.getLogger(__name__)

_vader = None

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

class FinbertUnavailable(Exception):
    pass

def _is_retryable_hf_error(exc: BaseException) -> bool:
    if isinstance(exc, HfHubHTTPError):
        response = getattr(exc, 'response', None)
        if response is not None:
            code = getattr(response, 'status_code', 0)
            return code == 429 or code >= 500
        return True
    if isinstance(exc, (ConnectionError, TimeoutError, OSError)):
        return True
    return False

def _log_retry_attempt(retry_state: RetryCallState) -> None:
    exc = retry_state.outcome.exception() if retry_state.outcome else None
    logger.warning(
        "HF API retry attempt",
        extra={
            "attempt": retry_state.attempt_number,
            "error": str(exc) if exc else "unknown",
        }
    )

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential_jitter(initial=1, max=10),
    retry=retry_if_exception(_is_retryable_hf_error),
    before_sleep=_log_retry_attempt,
    reraise=True,
)
async def _hf_inference_call(texts: list[str], token: str) -> list[float]:
    client = InferenceClient(token=token)
    scores: list[float] = []
    for text in texts:
        result = client.text_classification(text, model="ProsusAI/finbert")
        best = max(result, key=lambda x: x.score)
        label = (best.label or "").lower()
        prob = float(best.score)
        if "positive" in label:
            scores.append(prob)
        elif "negative" in label:
            scores.append(-prob)
        else:
            scores.append(0.0)
    return scores

async def hf_finbert_score(texts: list[str]) -> list[float]:
    token = hf_api_token()
    if not token:
        raise FinbertUnavailable("HF_API_TOKEN not configured")
    try:
        return await _hf_inference_call(texts, token)
    except HfHubHTTPError as e:
        response = getattr(e, 'response', None)
        status = getattr(response, 'status_code', 0) if response else 0
        logger.warning("HF API failed after retries", extra={"status": status, "error": str(e)})
        raise FinbertUnavailable(f"HuggingFace API error (HTTP {status}): {e}") from e
    except (ConnectionError, TimeoutError, OSError) as e:
        logger.warning("HF API connection failed after retries", extra={"error": str(e)})
        raise FinbertUnavailable(f"HuggingFace API connection error: {e}") from e
    except Exception as e:
        logger.warning("HF API unexpected error", extra={"error": str(e)})
        raise FinbertUnavailable(f"HuggingFace API error: {e}") from e

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

def blend(vader: float, finbert: Optional[float]) -> float:
    if finbert is None:
        return vader
    return 0.35 * vader + 0.65 * finbert

def compute_confidence_details(
    scores: list[float],
    has_news: bool,
    has_reddit: bool,
    has_x: bool = False,
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
    source_count = sum((has_news, has_reddit, has_x))
    mix = 1.0 if source_count >= 2 else 0.85
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

def compute_confidence(scores: list[float], has_news: bool, has_reddit: bool, has_x: bool = False) -> float:
    conf, _ = compute_confidence_details(scores, has_news=has_news, has_reddit=has_reddit, has_x=has_x)
    return conf

async def score_items(items: Iterable[dict], finbert_top_n: int = 12) -> list[ScoredItem]:
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
        fin_scores = await hf_finbert_score(fin_texts)
        fin_map = {id(top[i][0]): fin_scores[i] for i in range(len(top))}
    except FinbertUnavailable as e:
        if finbert_required():
            raise
        logger.info("Falling back to VADER-only scoring", extra={"reason": str(e)})
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

