import importlib
from fastapi.testclient import TestClient

def test_sentiment_cache_miss_then_hit(monkeypatch):
    monkeypatch.setenv("MOCK", "false")
    monkeypatch.setenv("SENTIMENT_CACHE_TTL_SECONDS", "300")
    monkeypatch.setenv("SENTIMENT_CACHE_STALE_SECONDS", "60")

    import backend.services.sentiment as sentiment_mod
    import backend.main as main_mod
    importlib.reload(sentiment_mod)
    importlib.reload(main_mod)
    calls = {"news": 0, "reddit": 0}

    def fake_news(ticker: str):
        calls["news"] += 1
        return [{"source": "news", "text": f"{ticker} good news", "ts": None}]

    def fake_reddit(ticker: str):
        calls["reddit"] += 1
        return [{"source": "reddit", "text": f"{ticker} bad reddit", "ts": None}]

    class FakeScored:
        _counter = 0

        def __init__(self, source, text, score):
            FakeScored._counter += 1
            self.source = source
            self.text = text
            self.score = score
            self.provider = "newsapi" if source == "news" else "reddit"
            self.item_id = f"{source}:{FakeScored._counter}"
            self.url = None
            self.ts = None
            self.vader = None
            self.finbert = None
            self.blended = None
            self.weight = None

    def fake_score_items(items, finbert_top_n=12):
        FakeScored._counter = 0
        return [FakeScored(it["source"], it["text"], 0.2 if it["source"] == "news" else -0.1) for it in items]

    def fake_confidence_details(scores, has_news, has_reddit):
        drivers = {
            "n": len(scores),
            "mean": 0.05,
            "std": 0.15,
            "volume": 0.5,
            "agreement": 0.6,
            "strength": 0.4,
            "mix": 0.5,
        }
        return 0.9, drivers

    monkeypatch.setattr(sentiment_mod, "fetch_news_items", fake_news)
    monkeypatch.setattr(sentiment_mod, "fetch_reddit_items", fake_reddit)
    monkeypatch.setattr(sentiment_mod, "score_items", fake_score_items)
    monkeypatch.setattr(sentiment_mod, "compute_confidence_details", fake_confidence_details)

    client = TestClient(main_mod.app)

    r1 = client.get("/sentiment/TSLA")
    assert r1.status_code == 200
    assert r1.headers.get("x-cache") == "MISS"

    r2 = client.get("/sentiment/TSLA")
    assert r2.status_code == 200
    assert r2.headers.get("x-cache") == "HIT"

    assert calls["news"] == 1
    assert calls["reddit"] == 1