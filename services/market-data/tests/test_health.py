from fastapi.testclient import TestClient
from market_data.main import app

client = TestClient(app, raise_server_exceptions=False)

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
    assert resp.status_code == 200
    assert resp.json() == {"status": "ready"}
