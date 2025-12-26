import importlib
from fastapi.testclient import TestClient

def test_mock_sets_x_cache_header(monkeypatch):
    monkeypatch.setenv("MOCK", "true")

    import backend.main as main_mod
    importlib.reload(main_mod)

    client = TestClient(main_mod.app)
    r = client.get("/sentiment/TSLA")
    assert r.status_code == 200
    assert r.headers.get("x-cache") == "MOCK"