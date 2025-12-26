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
        def __init__(self, source, text, score):
            self.source = source
            self.text = text
            self.score = score

    def fake_score_items(items, finbert_top_n=12):
        return [FakeScored(it["source"], it["text"], 0.2 if it["source"] == "news" else -0.1) for it in items]

    def fake_confidence(scores, has_news, has_reddit):
        return 0.9

    monkeypatch.setattr(sentiment_mod, "fetch_news_items", fake_news)
    monkeypatch.setattr(sentiment_mod, "fetch_reddit_items", fake_reddit)
    monkeypatch.setattr(sentiment_mod, "score_items", fake_score_items)
    monkeypatch.setattr(sentiment_mod, "compute_confidence", fake_confidence)

    client = TestClient(main_mod.app)

    r1 = client.get("/sentiment/TSLA")
    assert r1.status_code == 200
    assert r1.headers.get("x-cache") == "MISS"

    r2 = client.get("/sentiment/TSLA")
    assert r2.status_code == 200
    assert r2.headers.get("x-cache") == "HIT"

    assert calls["news"] == 1
    assert calls["reddit"] == 1