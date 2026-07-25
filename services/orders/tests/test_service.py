import uuid
from decimal import Decimal
from unittest.mock import MagicMock
import pytest
from common import OrderSide, OrderType, OrderStatus
from orders.schemas import SubmitOrderRequest
from orders.service import (
    OrderNotCancellableError,
    PortfolioNotFoundError,
)


def _limit_req(portfolio_id, side=OrderSide.BUY, price="150.00", qty="10"):
    return SubmitOrderRequest(
        portfolio_id=portfolio_id,
        symbol="AAPL",
        side=side,
        order_type=OrderType.LIMIT,
        quantity=Decimal(qty),
        price=Decimal(price),
    )


async def test_submit_limit_rests_on_empty_book(
    order_service, mock_session, active_portfolio, portfolio_id,
):
    mock_session.get.return_value = active_portfolio
    resp = await order_service.submit_order(_limit_req(portfolio_id), mock_session)
    assert resp.status == OrderStatus.OPEN
    assert resp.filled_quantity == Decimal("0")
    snap = order_service.get_orderbook("AAPL", 10)
    assert snap.best_bid == Decimal("150.00")


async def test_submit_market_fills_against_resting(
    order_service, mock_session, active_portfolio, portfolio_id, position_with_qty,
):
    mock_session.get.return_value = active_portfolio
    mock_session.execute.return_value = position_with_qty(qty="100")
    await order_service.submit_order(
        _limit_req(portfolio_id, OrderSide.SELL, price="100.00", qty="5"),
        mock_session,
    )
    result = MagicMock()
    result.scalars.return_value.all.return_value = []
    mock_session.execute.return_value = result
    resp = await order_service.submit_order(
        SubmitOrderRequest(
            portfolio_id=portfolio_id, symbol="AAPL",
            side=OrderSide.BUY, order_type=OrderType.MARKET,
            quantity=Decimal("5"),
        ),
        mock_session,
    )
    assert resp.status == OrderStatus.FILLED
    assert resp.average_fill_price == Decimal("100.00")


async def test_submit_portfolio_not_found(order_service, mock_session, portfolio_id):
    mock_session.get.return_value = None
    with pytest.raises(PortfolioNotFoundError):
        await order_service.submit_order(_limit_req(portfolio_id), mock_session)


async def test_cancel_filled_order_raises(order_service, mock_session, portfolio_id):
    mock_order = MagicMock()
    mock_order.id = uuid.uuid4()
    mock_order.portfolio_id = portfolio_id
    mock_order.status = OrderStatus.FILLED
    mock_session.get.return_value = mock_order
    with pytest.raises(OrderNotCancellableError):
        await order_service.cancel_order(mock_order.id, portfolio_id, mock_session)
