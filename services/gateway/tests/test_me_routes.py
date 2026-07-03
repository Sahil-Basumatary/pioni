import pytest
from fastapi.testclient import TestClient
import gateway.me_routes as me_routes
from gateway.auth import AuthContext, require_auth
from gateway.main import app


class _FakeResponse:
    def __init__(self, status_code, payload):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        return self._payload


class _FakeClient:
    def __init__(self, response):
        self._response = response
        self.calls: list = []

    async def get(self, url, headers=None):
        self.calls.append((url, headers))
        return self._response


@pytest.fixture
def client():
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture(autouse=True)
def _override_auth():
    app.dependency_overrides[require_auth] = lambda: AuthContext(
        clerk_id="user_abc", email="e@x.com", username="trader",
    )
    yield
    app.dependency_overrides.clear()


def _install_client(monkeypatch, fake):
    async def _get():
        return fake

    monkeypatch.setattr(me_routes, "_get_client", _get)


def test_my_portfolio_forwards_identity(monkeypatch, client):
    fake = _FakeClient(_FakeResponse(200, {"id": "p1", "cash_balance": "100000"}))
    _install_client(monkeypatch, fake)
    resp = client.get("/me/portfolio")
    assert resp.status_code == 200
    assert resp.json()["cash_balance"] == "100000"
    url, headers = fake.calls[0]
    assert url == "/me/portfolio"
    assert headers["X-Clerk-Id"] == "user_abc"
    assert headers["X-User-Email"] == "e@x.com"
    assert headers["X-User-Name"] == "trader"


def test_my_portfolio_omits_absent_optional_identity(monkeypatch, client):
    app.dependency_overrides[require_auth] = lambda: AuthContext(clerk_id="user_only")
    fake = _FakeClient(_FakeResponse(200, {"id": "p1"}))
    _install_client(monkeypatch, fake)
    resp = client.get("/me/portfolio")
    assert resp.status_code == 200
    _, headers = fake.calls[0]
    assert headers["X-Clerk-Id"] == "user_only"
    assert "X-User-Email" not in headers
    assert "X-User-Name" not in headers


def test_my_portfolio_propagates_upstream_error(monkeypatch, client):
    fake = _FakeClient(_FakeResponse(404, {"error": "portfolio_not_found"}))
    _install_client(monkeypatch, fake)
    resp = client.get("/me/portfolio")
    assert resp.status_code == 404
    assert resp.json()["error"] == "portfolio_not_found"
