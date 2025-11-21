def test_history_mock_mode():
    from fastapi.testclient import TestClient
    from backend.main import app

    client = TestClient(app)

    response = client.get("/sentiment/history/TSLA")
    assert response.status_code == 200

    data = response.json()
    assert "history" in data
    assert isinstance(data["history"], list)