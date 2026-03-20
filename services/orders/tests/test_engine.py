import uuid
from datetime import datetime, timezone
from decimal import Decimal
import pytest
from common import OrderSide, OrderType, OrderStatus, TimeInForce
from orders.book_types import BookOrder, RejectReason
from orders.engine import MatchingEngine


def _order(
    side: OrderSide = OrderSide.BUY,
    price: str = "100.00",
    qty: str = "10",
    order_type: OrderType = OrderType.LIMIT,
    tif: TimeInForce = TimeInForce.GTC,
    stop_price: str | None = None,
) -> BookOrder:
    return BookOrder(
        order_id=uuid.uuid4(),
        symbol="AAPL",
        side=side,
        order_type=order_type,
        price=Decimal(price),
        quantity=Decimal(qty),
        remaining=Decimal(qty),
        timestamp=datetime.now(timezone.utc),
        time_in_force=tif,
        stop_price=Decimal(stop_price) if stop_price else None,
    )


@pytest.fixture
def engine() -> MatchingEngine:
    return MatchingEngine("AAPL")


def test_market_order_fills_against_resting(engine: MatchingEngine):
    engine.submit(_order(OrderSide.SELL, "100.00", "10"))
    result = engine.submit(_order(OrderSide.BUY, qty="10", order_type=OrderType.MARKET))
    assert result.status == OrderStatus.FILLED
    assert result.fills[0].price == Decimal("100.00")
    assert result.remaining_quantity == Decimal("0")


def test_market_order_rejected_on_empty_book(engine: MatchingEngine):
    result = engine.submit(_order(OrderSide.BUY, qty="5", order_type=OrderType.MARKET))
    assert result.status == OrderStatus.REJECTED
    assert result.reject_reason == RejectReason.NO_LIQUIDITY


def test_limit_gtc_rests_unfilled_remainder(engine: MatchingEngine):
    engine.submit(_order(OrderSide.SELL, "100.00", "3"))
    result = engine.submit(_order(OrderSide.BUY, "100.00", "10"))
    assert result.status == OrderStatus.PARTIALLY_FILLED
    assert result.remaining_quantity == Decimal("7")
    assert engine.book.best_bid == Decimal("100.00")


def test_limit_ioc_cancels_unfilled_remainder(engine: MatchingEngine):
    engine.submit(_order(OrderSide.SELL, "100.00", "3"))
    result = engine.submit(_order(OrderSide.BUY, "100.00", "10", tif=TimeInForce.IOC))
    assert result.status == OrderStatus.PARTIALLY_FILLED
    assert len(engine.book) == 0


def test_stop_loss_triggers_on_price_cross(engine: MatchingEngine):
    engine.submit(_order(OrderSide.BUY, "90.00", "10"))
    stop = _order(OrderSide.SELL, "0", "10", OrderType.STOP_LOSS, stop_price="95.00")
    engine.submit(stop)
    results = engine.check_stops(Decimal("94.00"))
    assert len(results) == 1
    assert results[0].status == OrderStatus.FILLED


def test_cancel_removes_from_book(engine: MatchingEngine):
    order = _order(OrderSide.BUY, "99.00", "10")
    engine.submit(order)
    assert engine.cancel(order.order_id) is not None
    assert len(engine.book) == 0
