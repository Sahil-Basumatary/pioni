from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient
from orders.main import app

client = TestClient(app, raise_server_exceptions=False)


def _factory_returning(session):
    @asynccontextmanager
    async def _ctx():
        yield session

    return lambda: _ctx


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "healthy", "service": "orders"}


def test_health_live():
    resp = client.get("/health/live")
    assert resp.status_code == 200
    assert resp.json() == {"status": "alive"}


def test_health_ready_when_db_answers():
    session = AsyncMock()
    with patch("orders.main.get_session_factory", _factory_returning(session)):
        resp = client.get("/health/ready")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ready"
    assert body["checks"]["db"] is True


def test_health_not_ready_when_db_is_unreachable():
    session = AsyncMock()
    session.execute.side_effect = RuntimeError("connection refused")
    with patch("orders.main.get_session_factory", _factory_returning(session)):
        resp = client.get("/health/ready")
    assert resp.status_code == 503
    assert resp.json() == {"status": "not_ready"}
