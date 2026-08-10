from __future__ import annotations
import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
from common.middleware import RequestIdMiddleware
from common.ratelimit import RateLimitMiddleware


def _app_with(*middleware) -> FastAPI:
    app = FastAPI()
    for cls, kwargs in middleware:
        app.add_middleware(cls, **kwargs)

    @app.get("/ping")
    async def ping(request: Request):
        return {"request_id": getattr(request.state, "request_id", None)}

    return app


def test_request_id_header_and_state_propagation():
    client = TestClient(_app_with((RequestIdMiddleware, {})))
    resp = client.get("/ping")
    assert resp.status_code == 200
    header_id = resp.headers["X-Request-ID"]
    assert len(header_id) == 12
    assert resp.json()["request_id"] == header_id


def test_request_ids_are_unique_per_request():
    client = TestClient(_app_with((RequestIdMiddleware, {})))
    first = client.get("/ping").headers["X-Request-ID"]
    second = client.get("/ping").headers["X-Request-ID"]
    assert first != second


def test_rate_limit_skips_market_read_gets(monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_ENABLED", "true")
    app = FastAPI()
    app.add_middleware(
        RateLimitMiddleware,
        get_cors_origins=lambda: [],
        max_requests=1,
        window_seconds=60,
    )

    @app.get("/orderbook/{symbol}")
    async def book(symbol: str):
        return {"symbol": symbol}

    @app.get("/ping")
    async def ping():
        return {"ok": True}

    client = TestClient(app)
    assert client.get("/orderbook/BTCUSDT").status_code == 200
    assert client.get("/orderbook/BTCUSDT").status_code == 200
    assert client.get("/ping").status_code == 200
    assert client.get("/ping").status_code == 429


def test_rate_limit_bypasses_when_disabled(monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_ENABLED", "false")
    client = TestClient(
        _app_with(
            (RateLimitMiddleware, {"get_cors_origins": lambda: [], "max_requests": 1, "window_seconds": 60}),
        )
    )
    for _ in range(5):
        assert client.get("/ping").status_code == 200


def test_rate_limit_429_carries_cors_headers_for_allowed_origin(monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_ENABLED", "true")
    origin = "http://allowed.example"
    client = TestClient(
        _app_with(
            (RateLimitMiddleware, {"get_cors_origins": lambda: [origin], "max_requests": 1, "window_seconds": 60}),
        )
    )
    client.get("/ping", headers={"origin": origin})
    blocked = client.get("/ping", headers={"origin": origin})
    assert blocked.status_code == 429
    assert blocked.headers["Access-Control-Allow-Origin"] == origin


def test_rate_limit_and_request_id_compose(monkeypatch):
    # request-id is outer to rate-limit, so an allowed request still gets an id header.
    monkeypatch.setenv("RATE_LIMIT_ENABLED", "true")
    client = TestClient(
        _app_with(
            (RateLimitMiddleware, {"get_cors_origins": lambda: [], "max_requests": 5, "window_seconds": 60}),
            (RequestIdMiddleware, {}),
        )
    )
    resp = client.get("/ping")
    assert resp.status_code == 200
    assert "X-Request-ID" in resp.headers


@pytest.mark.parametrize("method", ["OPTIONS"])
def test_rate_limit_ignores_preflight(monkeypatch, method):
    monkeypatch.setenv("RATE_LIMIT_ENABLED", "true")
    app = _app_with(
        (RateLimitMiddleware, {"get_cors_origins": lambda: [], "max_requests": 1, "window_seconds": 60}),
    )

    @app.options("/ping")
    async def ping_options():
        return {"ok": True}

    client = TestClient(app)
    for _ in range(3):
        assert client.options("/ping").status_code == 200
