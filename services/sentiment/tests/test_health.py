from fastapi.testclient import TestClient
from sentiment.main import app

client = TestClient(app, raise_server_exceptions=False)

def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"

def test_health_live():
    resp = client.get("/health/live")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"

def test_health_ready():
    resp = client.get("/health/ready")
    assert resp.status_code in (200, 503)
    body = resp.json()
    assert "status" in body
