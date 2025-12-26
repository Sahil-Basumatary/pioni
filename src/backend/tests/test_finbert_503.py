import importlib
from fastapi.testclient import TestClient

def test_finbert_unavailable_returns_503(monkeypatch):
    monkeypatch.setenv("MOCK", "false")

    import backend.services.sentiment as sentiment_mod
    import backend.main as main_mod
    importlib.reload(sentiment_mod)
    importlib.reload(main_mod)

    monkeypatch.setattr(
        sentiment_mod,
        "fetch_news_items",
        lambda ticker: [{"source": "news", "text": "x", "ts": None}],
    )
    monkeypatch.setattr(
        sentiment_mod,
        "fetch_reddit_items",
        lambda ticker: [{"source": "reddit", "text": "y", "ts": None}],
    )

    def boom(*args, **kwargs):
        raise sentiment_mod.FinbertUnavailable("FinBERT not installed")

    monkeypatch.setattr(sentiment_mod, "score_items", boom)

    client = TestClient(main_mod.app)
    r = client.get("/sentiment/TSLA")
    assert r.status_code == 503
    body = r.json()
    assert body["error"] == "FINBERT_UNAVAILABLE"