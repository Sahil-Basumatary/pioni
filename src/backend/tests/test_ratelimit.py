import importlib
from fastapi.testclient import TestClient

def test_rate_limit_returns_429(monkeypatch):
    monkeypatch.setenv("MOCK", "true")
    monkeypatch.setenv("RATE_LIMIT_MAX_REQUESTS", "1")
    monkeypatch.setenv("RATE_LIMIT_WINDOW_SECONDS", "60")

    import backend.core.ratelimit as rl
    importlib.reload(rl)

    import backend.main as main_mod
    importlib.reload(main_mod)

    client = TestClient(main_mod.app)
    headers = {"X-Forwarded-For": "1.2.3.4"}

    r1 = client.get("/sentiment/TSLA", headers=headers)
    assert r1.status_code == 200

    r2 = client.get("/sentiment/TSLA", headers=headers)
    assert r2.status_code == 429, r2.text
    assert "error" in r2.json()