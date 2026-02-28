from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient


def _make_client():
    with patch("market_data.main.BinanceWSClient") as mock_ws:
        instance = AsyncMock()
        instance.start = AsyncMock()
        instance.stop = AsyncMock()
        instance.connected = False
        mock_ws.return_value = instance
        from market_data.main import app
        return TestClient(app, raise_server_exceptions=False)


client = _make_client()


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "healthy", "service": "market-data"}


def test_health_live():
    resp = client.get("/health/live")
    assert resp.status_code == 200
    assert resp.json() == {"status": "alive"}


def test_health_ready():
    resp = client.get("/health/ready")
    assert resp.status_code in (200, 503)
    body = resp.json()
    assert "status" in body
    assert "binance_ws" in body
    assert "redis" in body
