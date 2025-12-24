import importlib
from fastapi.testclient import TestClient

def test_sentiment_cache_hits(monkeypatch):
    monkeypatch.setenv("MOCK", "false")
    monkeypatch.setenv("SENTIMENT_CACHE_TTL_SECONDS", "60")

    import backend.services.sentiment as sentiment_mod
    import backend.main as main_mod
    importlib.reload(sentiment_mod)
    importlib.reload(main_mod)

    call_counts = {"news": 0, "reddit": 0, "score": 0}

    def fake_news_items(ticker: str):
        call_counts["news"] += 1
        return [{"source": "news", "text": f"{ticker} good news", "ts": None}]

    def fake_reddit_items(ticker: str):
        call_counts["reddit"] += 1
        return [{"source": "reddit", "text": f"{ticker} bad reddit", "ts": None}]

    class FakeScored:
        def __init__(self, source, text, score, ts=None):
            self.source = source
            self.text = text
            self.score = score
            self.ts = ts

    def fake_score_items(items, finbert_top_n=12):
        call_counts["score"] += 1
        out = []
        for it in items:
            s = 0.2 if it["source"] == "news" else -0.1
            out.append(FakeScored(it["source"], it["text"], s, it.get("ts")))
        return out

    monkeypatch.setattr(sentiment_mod, "fetch_news_items", fake_news_items)
    monkeypatch.setattr(sentiment_mod, "fetch_reddit_items", fake_reddit_items)
    monkeypatch.setattr(sentiment_mod, "score_items", fake_score_items)

    client = TestClient(main_mod.app)

    r1 = client.get("/sentiment/TSLA")
    assert r1.status_code == 200

    r2 = client.get("/sentiment/TSLA")
    assert r2.status_code == 200
    assert call_counts["news"] == 1
    assert call_counts["reddit"] == 1
    assert call_counts["score"] == 1