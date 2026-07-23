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


class _FakeProxyClient:
    def __init__(self, response):
        self._response = response
        self.calls: list = []

    async def get(self, url, headers=None, params=None):
        self.calls.append((url, params))
        return self._response


def _auth_with_portfolio(portfolio_id="P1"):
    # Seeding portfolio_id on the context short-circuits resolve_portfolio_id so the proxy
    # tests exercise only the data hop, not id resolution (covered elsewhere).
    app.dependency_overrides[require_auth] = lambda: AuthContext(
        clerk_id="user_abc", portfolio_id=portfolio_id,
    )


def test_my_summary_proxies_to_resolved_portfolio(monkeypatch, client):
    _auth_with_portfolio("P1")
    fake = _FakeProxyClient(_FakeResponse(200, {"total_value": "100000"}))
    _install_client(monkeypatch, fake)
    resp = client.get("/me/summary")
    assert resp.status_code == 200
    assert resp.json()["total_value"] == "100000"
    assert fake.calls[0][0] == "/portfolios/P1/summary"


def test_my_positions_forwards_open_only(monkeypatch, client):
    _auth_with_portfolio("P1")
    fake = _FakeProxyClient(_FakeResponse(200, []))
    _install_client(monkeypatch, fake)
    resp = client.get("/me/positions?open_only=true")
    assert resp.status_code == 200
    url, params = fake.calls[0]
    assert url == "/portfolios/P1/positions"
    assert params == {"open_only": True}


def test_my_trades_forwards_filters(monkeypatch, client):
    _auth_with_portfolio("P1")
    fake = _FakeProxyClient(_FakeResponse(200, []))
    _install_client(monkeypatch, fake)
    resp = client.get("/me/trades?symbol=BTCUSDT&limit=10&offset=5")
    assert resp.status_code == 200
    url, params = fake.calls[0]
    assert url == "/portfolios/P1/trades"
    assert params == {"limit": 10, "offset": 5, "symbol": "BTCUSDT"}


def test_my_trades_omits_symbol_when_absent(monkeypatch, client):
    _auth_with_portfolio("P1")
    fake = _FakeProxyClient(_FakeResponse(200, []))
    _install_client(monkeypatch, fake)
    resp = client.get("/me/trades")
    assert resp.status_code == 200
    _, params = fake.calls[0]
    assert "symbol" not in params
    assert params == {"limit": 50, "offset": 0}


def test_my_pnl_chart_forwards_days(monkeypatch, client):
    _auth_with_portfolio("P1")
    fake = _FakeProxyClient(_FakeResponse(200, []))
    _install_client(monkeypatch, fake)
    resp = client.get("/me/pnl-chart?days=7")
    assert resp.status_code == 200
    url, params = fake.calls[0]
    assert url == "/portfolios/P1/pnl-chart"
    assert params == {"days": 7}


def test_my_summary_propagates_upstream_error(monkeypatch, client):
    _auth_with_portfolio("P1")
    fake = _FakeProxyClient(_FakeResponse(404, {"error": "portfolio_not_found"}))
    _install_client(monkeypatch, fake)
    resp = client.get("/me/summary")
    assert resp.status_code == 404
    assert resp.json()["error"] == "portfolio_not_found"


def test_my_positions_rejects_invalid_query(client):
    _auth_with_portfolio("P1")
    resp = client.get("/me/trades?limit=0")
    assert resp.status_code == 422


class _FakePostClient:
    def __init__(self, response):
        self._response = response
        self.calls: list = []

    async def get(self, url, headers=None, params=None):
        self.calls.append(("GET", url))
        return self._response

    async def post(self, url):
        self.calls.append(("POST", url))
        return self._response


def test_reset_my_portfolio_proxies_post(monkeypatch, client):
    _auth_with_portfolio("P1")
    fake = _FakePostClient(_FakeResponse(200, {"id": "P1", "cash_balance": "100000"}))
    _install_client(monkeypatch, fake)
    resp = client.post("/me/portfolio/reset")
    assert resp.status_code == 200
    assert resp.json()["cash_balance"] == "100000"
    assert ("POST", "/portfolios/P1/reset") in fake.calls


def test_reset_my_portfolio_propagates_error(monkeypatch, client):
    _auth_with_portfolio("P1")
    fake = _FakePostClient(_FakeResponse(404, {"error": "portfolio_not_found"}))
    _install_client(monkeypatch, fake)
    resp = client.post("/me/portfolio/reset")
    assert resp.status_code == 404


class _FakeOnboardingClient:
    def __init__(self, response):
        self._response = response
        self.calls: list = []

    async def get(self, url, headers=None, params=None):
        self.calls.append(("GET", url, headers, params))
        return self._response

    async def patch(self, url, headers=None, json=None):
        self.calls.append(("PATCH", url, headers, json))
        return self._response


def test_my_onboarding_forwards_identity(monkeypatch, client):
    fake = _FakeOnboardingClient(
        _FakeResponse(200, {"welcome_seen": False, "tour_completed": False}),
    )
    _install_client(monkeypatch, fake)
    resp = client.get("/me/onboarding")
    assert resp.status_code == 200
    assert resp.json()["welcome_seen"] is False
    method, url, headers, _ = fake.calls[0]
    assert method == "GET"
    assert url == "/me/onboarding"
    assert headers["X-Clerk-Id"] == "user_abc"


def test_patch_my_onboarding_forwards_body(monkeypatch, client):
    fake = _FakeOnboardingClient(
        _FakeResponse(200, {"welcome_seen": True, "tour_skipped": True}),
    )
    _install_client(monkeypatch, fake)
    resp = client.patch("/me/onboarding", json={"tour_skipped": True})
    assert resp.status_code == 200
    assert resp.json()["tour_skipped"] is True
    method, url, headers, body = fake.calls[0]
    assert method == "PATCH"
    assert url == "/me/onboarding"
    assert headers["X-Clerk-Id"] == "user_abc"
    assert body == {"tour_skipped": True}
