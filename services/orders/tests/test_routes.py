import uuid
from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from common import get_db, OrderSide, OrderType, OrderStatus, TimeInForce
from orders.book_types import BookSnapshot
from orders.routes import router
from orders.schemas import OrderResponse, CancelOrderResponse
from orders.service import OrderNotFoundError


def _order_response(**overrides):
    now = datetime.now(timezone.utc)
    defaults = dict(
        id=uuid.uuid4(), portfolio_id=uuid.uuid4(),
        symbol="AAPL", side=OrderSide.BUY, order_type=OrderType.LIMIT,
        time_in_force=TimeInForce.GTC, status=OrderStatus.OPEN,
        quantity=Decimal("10"), price=Decimal("150.00"), stop_price=None,
        filled_quantity=Decimal("0"), average_fill_price=None,
        created_at=now, updated_at=now,
    )
    defaults.update(overrides)
    return OrderResponse(**defaults)


@pytest.fixture
def mock_svc():
    svc = MagicMock()
    svc.submit_order = AsyncMock()
    svc.cancel_order = AsyncMock()
    svc.get_order = AsyncMock()
    svc.list_orders = AsyncMock()
    return svc


@pytest.fixture
def client(mock_svc):
    app = FastAPI()
    app.include_router(router)
    async def _db():
        yield AsyncMock()
    app.dependency_overrides[get_db] = _db
    with patch("orders.routes.get_order_service", return_value=mock_svc):
        yield TestClient(app, raise_server_exceptions=False)


def test_submit_order_returns_201(client, mock_svc):
    mock_svc.submit_order.return_value = _order_response()
    resp = client.post("/orders", json={
        "portfolio_id": str(uuid.uuid4()), "symbol": "AAPL",
        "side": "BUY", "order_type": "LIMIT",
        "quantity": "10", "price": "150.00",
    })
    assert resp.status_code == 201
    assert resp.json()["status"] == "OPEN"


def test_submit_limit_without_price_returns_422(client, mock_svc):
    resp = client.post("/orders", json={
        "portfolio_id": str(uuid.uuid4()), "symbol": "AAPL",
        "side": "BUY", "order_type": "LIMIT", "quantity": "10",
    })
    assert resp.status_code == 422


def test_cancel_order_success(client, mock_svc):
    oid = uuid.uuid4()
    mock_svc.cancel_order.return_value = CancelOrderResponse(
        order_id=oid, status=OrderStatus.CANCELLED,
        remaining_quantity=Decimal("10"),
    )
    resp = client.delete(f"/orders/{oid}", params={"portfolio_id": str(uuid.uuid4())})
    assert resp.status_code == 200
    assert resp.json()["status"] == "CANCELLED"


def test_get_order_not_found(client, mock_svc):
    oid = uuid.uuid4()
    mock_svc.get_order.side_effect = OrderNotFoundError(oid)
    resp = client.get(f"/orders/{oid}", params={"portfolio_id": str(uuid.uuid4())})
    assert resp.status_code == 404
