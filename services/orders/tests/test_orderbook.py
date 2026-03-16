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


def test_fifo_at_same_price(book: OrderBook):
    ids = [uuid.uuid4() for _ in range(3)]
    for oid in ids:
        book.add(_order(OrderSide.BUY, "100.00", order_id=oid))
    key = book._price_key(OrderSide.BUY, Decimal("100.00"))
    queue = book._side_book(OrderSide.BUY)[key]
    assert [o.order_id for o in queue] == ids


def test_fifo_preserved_after_middle_cancel(book: OrderBook):
    o1 = _order(OrderSide.SELL, "101.00")
    o2 = _order(OrderSide.SELL, "101.00")
    o3 = _order(OrderSide.SELL, "101.00")
    book.add(o1)
    book.add(o2)
    book.add(o3)
    book.cancel(o2.order_id)
    key = book._price_key(OrderSide.SELL, Decimal("101.00"))
    queue = book._side_book(OrderSide.SELL)[key]
    assert [o.order_id for o in queue] == [o1.order_id, o3.order_id]


def test_cancel_cleans_empty_price_level(book: OrderBook):
    order = _order(OrderSide.BUY, "100.00")
    book.add(order)
    book.cancel(order.order_id)
    assert len(book._bids) == 0


def test_snapshot(book: OrderBook):
    book.add(_order(OrderSide.BUY, "100.00"))
    book.add(_order(OrderSide.SELL, "101.00"))
    snap = book.snapshot(depth=5)
    assert snap.symbol == "AAPL"
    assert len(snap.bids) == 1
    assert len(snap.asks) == 1
    assert snap.best_bid == Decimal("100.00")
    assert snap.spread == Decimal("1.00")


def test_snapshot_empty(book: OrderBook):
    snap = book.snapshot()
    assert snap.bids == []
    assert snap.asks == []
    assert snap.best_bid is None
    assert snap.spread is None


def test_volume_at(book: OrderBook):
    book.add(_order(OrderSide.BUY, "100.00", qty="10"))
    book.add(_order(OrderSide.BUY, "100.00", qty="25"))
    assert book.volume_at(OrderSide.BUY, Decimal("100.00")) == Decimal("35")
    assert book.volume_at(OrderSide.SELL, Decimal("999.00")) == Decimal("0")


def test_bulk_insert_cancel_no_level_leak(book: OrderBook):
    orders = []
    for i in range(100):
        price = str(Decimal("90.00") + Decimal(i) / Decimal(10))
        o = _order(OrderSide.BUY, price)
        book.add(o)
        orders.append(o)
    assert len(book) == 100
    for o in orders:
        book.cancel(o.order_id)
    assert len(book) == 0
    assert len(book._bids) == 0
