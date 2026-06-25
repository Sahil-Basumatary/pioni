from fastapi.testclient import TestClient

from sentiment.main import app
from sentiment.signals import build_signal

client = TestClient(app, raise_server_exceptions=False)


def test_build_signal_marks_positive_spike_as_buy():
    signal = build_signal(
        {
            "ticker": "BTC",
            "asset_class": "crypto",
            "sentiment": 0.42,
            "confidence": 0.8,
            "sources": {"newsapi": 0.3, "reddit": 0.5},
        },
        [
            {"date": "2026-06-15", "score": 0.05},
            {"date": "2026-06-16", "score": 0.12},
            {"date": "2026-06-17", "score": 0.2},
        ],
    )

    assert signal["action"] == "BUY"
    assert signal["delta"] == 0.3
    assert signal["inputs"]["previous_sentiment"] == 0.12


def test_mock_signal_endpoint_normalizes_crypto_pair(monkeypatch):
    monkeypatch.setenv("MOCK", "true")

    resp = client.get("/signals/BTCUSDT")

    assert resp.status_code == 200
    body = resp.json()
    assert body["ticker"] == "BTC"
    assert body["asset_class"] == "crypto"
    assert body["action"] == "BULLISH_WATCH"
    assert body["inputs"]["sources"] == {"mock_crypto": 0.42}

