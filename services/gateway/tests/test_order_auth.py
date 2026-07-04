import pytest
from fastapi.testclient import TestClient
import gateway.me_routes as me_routes
import gateway.order_routes as order_routes
from gateway.auth import AuthContext, require_auth
from gateway.main import app


class _Resp:
    def __init__(self, status_code, payload):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        return self._payload


class _FakePortfolioClient:
    def __init__(self, payload, status_code=200):
        self._resp = _Resp(status_code, payload)

    async def get(self, url, headers=None):
        return self._resp


class _FakeOrdersClient:
    def __init__(self, resp):
        self._resp = resp
        self.calls: list = []

    async def post(self, url, json=None):
        self.calls.append(("POST", url, {"json": json}))
        return self._resp

    async def delete(self, url, params=None):
        self.calls.append(("DELETE", url, {"params": params}))
        return self._resp

    async def get(self, url, params=None):
        self.calls.append(("GET", url, {"params": params}))
        return self._resp


@pytest.fixture
def client():
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture
def _auth():
    app.dependency_overrides[require_auth] = lambda: AuthContext(clerk_id="user_abc")
    yield
    app.dependency_overrides.clear()


def _wire(monkeypatch, orders_resp):
    portfolio_client = _FakePortfolioClient({"id": "P_OWNED"})
    orders_client = _FakeOrdersClient(orders_resp)

    async def _pget():
        return portfolio_client

    async def _oget():
        return orders_client

    monkeypatch.setattr(me_routes, "_get_client", _pget)
    monkeypatch.setattr(order_routes, "_get_client", _oget)
    return orders_client


def test_submit_ignores_client_portfolio_id(monkeypatch, client, _auth):
    orders_client = _wire(monkeypatch, _Resp(201, {"id": "O1", "status": "FILLED"}))
    resp = client.post(
        "/orders",
        json={
            "portfolio_id": "P_SOMEONE_ELSE",
            "symbol": "BTCUSDT",
            "side": "BUY",
            "order_type": "MARKET",
            "quantity": "0.1",
        },
    )
    assert resp.status_code == 201
    _, url, kwargs = orders_client.calls[0]
    assert url == "/orders"
    assert kwargs["json"]["portfolio_id"] == "P_OWNED"


def test_list_orders_scoped_to_caller_portfolio(monkeypatch, client, _auth):
    orders_client = _wire(monkeypatch, _Resp(200, []))
    resp = client.get("/orders?portfolio_id=P_SOMEONE_ELSE")
    assert resp.status_code == 200
    _, url, kwargs = orders_client.calls[0]
    assert url == "/orders"
    assert kwargs["params"]["portfolio_id"] == "P_OWNED"


def test_cancel_scoped_to_caller_portfolio(monkeypatch, client, _auth):
    orders_client = _wire(monkeypatch, _Resp(200, {"status": "CANCELLED"}))
    order_id = "11111111-1111-1111-1111-111111111111"
    resp = client.delete(f"/orders/{order_id}")
    assert resp.status_code == 200
    _, url, kwargs = orders_client.calls[0]
    assert url == f"/orders/{order_id}"
    assert kwargs["params"]["portfolio_id"] == "P_OWNED"


def test_submit_requires_authentication(client):
    resp = client.post(
        "/orders",
        json={"symbol": "BTCUSDT", "side": "BUY", "order_type": "MARKET", "quantity": "0.1"},
    )
    assert resp.status_code == 401
