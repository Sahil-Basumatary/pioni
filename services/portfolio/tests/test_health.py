from fastapi.testclient import TestClient
from portfolio.main import app

client = TestClient(app, raise_server_exceptions=False)

def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "healthy", "service": "portfolio"}

def test_health_live():
    resp = client.get("/health/live")
    assert resp.status_code == 200
    assert resp.json() == {"status": "alive"}

def test_health_ready():
    resp = client.get("/health/ready")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ready"}
