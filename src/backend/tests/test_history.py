def test_history_mock_mode():
    from fastapi.testclient import TestClient
    import main

    client = TestClient(main.app)

    response = client.get("/sentiment/history/TSLA")
    assert response.status_code == 200

    data = response.json()
    assert "history" in data
    assert isinstance(data["history"], list)