import uuid
from datetime import datetime, timezone
from decimal import Decimal
import pytest
from common import OrderSide
from orders.book_types import BookOrder
from orders.orderbook import OrderBook


def _order(
    side: OrderSide = OrderSide.BUY,
    price: str = "100.00",
    qty: str = "10",
    order_id: uuid.UUID | None = None,
) -> BookOrder:
    return BookOrder(
        order_id=order_id or uuid.uuid4(),
        symbol="AAPL",
        side=side,
        price=Decimal(price),
        quantity=Decimal(qty),
        remaining=Decimal(qty),
        timestamp=datetime.now(timezone.utc),
    )


@pytest.fixture
def book() -> OrderBook:
    return OrderBook("AAPL")


def test_add_single_bid(book: OrderBook):
    book.add(_order(OrderSide.BUY, "100.00"))
    assert book.best_bid == Decimal("100.00")
    assert book.best_ask is None
    assert len(book) == 1


def test_add_single_ask(book: OrderBook):
    book.add(_order(OrderSide.SELL, "101.00"))
    assert book.best_ask == Decimal("101.00")
    assert book.best_bid is None


def test_best_bid_is_highest(book: OrderBook):
    book.add(_order(OrderSide.BUY, "99.00"))
    book.add(_order(OrderSide.BUY, "100.50"))
    book.add(_order(OrderSide.BUY, "98.00"))
    assert book.best_bid == Decimal("100.50")


def test_best_ask_is_lowest(book: OrderBook):
    book.add(_order(OrderSide.SELL, "102.00"))
    book.add(_order(OrderSide.SELL, "101.00"))
    book.add(_order(OrderSide.SELL, "103.50"))
    assert book.best_ask == Decimal("101.00")


def test_duplicate_id_raises(book: OrderBook):
    oid = uuid.uuid4()
    book.add(_order(OrderSide.BUY, "100.00", order_id=oid))
    with pytest.raises(ValueError, match="duplicate"):
        book.add(_order(OrderSide.SELL, "101.00", order_id=oid))


def test_cancel_returns_order(book: OrderBook):
    order = _order(OrderSide.BUY, "99.50")
    book.add(order)
    cancelled = book.cancel(order.order_id)
    assert cancelled is not None
    assert cancelled.order_id == order.order_id
    assert len(book) == 0


def test_cancel_nonexistent(book: OrderBook):
    assert book.cancel(uuid.uuid4()) is None


def test_cancel_updates_best_bid(book: OrderBook):
    top = _order(OrderSide.BUY, "100.00")
    book.add(top)
    book.add(_order(OrderSide.BUY, "99.00"))
    book.cancel(top.order_id)
    assert book.best_bid == Decimal("99.00")


def test_spread(book: OrderBook):
    book.add(_order(OrderSide.BUY, "100.00"))
    book.add(_order(OrderSide.SELL, "101.50"))
    assert book.spread == Decimal("1.50")


def test_spread_none_when_one_side_empty(book: OrderBook):
    book.add(_order(OrderSide.BUY, "100.00"))
    assert book.spread is None


def test_depth_ordering_and_aggregation(book: OrderBook):
    book.add(_order(OrderSide.BUY, "100.00", qty="10"))
    book.add(_order(OrderSide.BUY, "100.00", qty="5"))
    book.add(_order(OrderSide.BUY, "99.50", qty="20"))
    levels = book.depth(OrderSide.BUY, levels=2)
    assert len(levels) == 2
    assert levels[0].price == Decimal("100.00")
    assert levels[0].total_quantity == Decimal("15")
    assert levels[0].order_count == 2
    assert levels[1].price == Decimal("99.50")


def test_empty_book(book: OrderBook):
    assert book.best_bid is None
    assert book.best_ask is None
    assert book.spread is None
    assert len(book) == 0
    assert book.depth(OrderSide.BUY) == []
