from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_error_shape_includes_request_id():
    res = client.get("/sentiment/NOTREAL")
    assert res.status_code in (404, 422)
    payload = res.json()
    assert "detail" in payload
    assert "error" in payload["detail"]
    assert "message" in payload["detail"]
    assert "request_id" in payload["detail"]
    assert res.headers.get("X-Request-ID")
