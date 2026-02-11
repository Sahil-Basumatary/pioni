from fastapi.testclient import TestClient
from gateway.main import app

client = TestClient(app, raise_server_exceptions=False)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_health_live():
    response = client.get("/health/live")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
