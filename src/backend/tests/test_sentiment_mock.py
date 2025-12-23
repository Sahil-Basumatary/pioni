import os
from fastapi.testclient import TestClient
from backend.main import app

def test_mock_sentiment_mode():
    os.environ["MOCK"] = "true"
    client = TestClient(app)

    response = client.get("/sentiment/AAPL")
    assert response.status_code == 200

    data = response.json()
    assert data["ticker"] == "AAPL"
    assert "sentiment" in data
    assert "sources" in data
    assert "confidence" in data

    assert "highlights" in data
    assert isinstance(data["highlights"], list)
    assert data["highlights"] == []