from fastapi.testclient import TestClient

from sentiment.main import app

client = TestClient(app, raise_server_exceptions=False)


def test_mock_crypto_sentiment_normalizes_trading_pair(monkeypatch):
    monkeypatch.setenv("MOCK", "true")

    resp = client.get("/analyze/BTCUSDT")

    assert resp.status_code == 200
    body = resp.json()
    assert body["ticker"] == "BTC"
    assert body["asset_class"] == "crypto"
    assert body["n_x"] == 0
    assert body["confidence_drivers"]["n_x"] == 0


def test_mock_crypto_feed_includes_asset_class(monkeypatch):
    monkeypatch.setenv("MOCK", "true")

    resp = client.get("/feed/ETH")

    assert resp.status_code == 200
    body = resp.json()
    assert body["ticker"] == "ETH"
    assert body["asset_class"] == "crypto"
    assert body["items"]

