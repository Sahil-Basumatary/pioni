from __future__ import annotations
import uuid
from collections import deque
from datetime import datetime, timezone
from decimal import Decimal
from sortedcontainers import SortedDict
from common import OrderSide
from orders.book_types import BookOrder, BookSnapshot, PriceLevelView


class OrderBook:
    """In-memory limit order book for a single symbol.

    Price-time priority: orders at the same price execute in FIFO order.
    Bids stored with negated keys so SortedDict yields best (highest) bid
    at index 0, matching asks' best (lowest) ask at index 0.
    """

    __slots__ = ("symbol", "_bids", "_asks", "_orders")

    def __init__(self, symbol: str) -> None:
        self.symbol = symbol
        self._bids: SortedDict[Decimal, deque[BookOrder]] = SortedDict()
        self._asks: SortedDict[Decimal, deque[BookOrder]] = SortedDict()
        self._orders: dict[uuid.UUID, BookOrder] = {}

    def add(self, order: BookOrder) -> None:
        if order.order_id in self._orders:
            raise ValueError(f"duplicate order id: {order.order_id}")
        book = self._side_book(order.side)
        key = self._price_key(order.side, order.price)
        if key not in book:
            book[key] = deque()
        book[key].append(order)
        self._orders[order.order_id] = order

    def cancel(self, order_id: uuid.UUID) -> BookOrder | None:
        order = self._orders.pop(order_id, None)
        if order is None:
            return None
        book = self._side_book(order.side)
        key = self._price_key(order.side, order.price)
        level = book.get(key)
        if level is not None:
            try:
                level.remove(order)
            except ValueError:
                pass
            if not level:
                del book[key]
        return order

    @property
    def best_bid(self) -> Decimal | None:
        return self._best_price(OrderSide.BUY)

    @property
    def best_ask(self) -> Decimal | None:
        return self._best_price(OrderSide.SELL)

    @property
    def spread(self) -> Decimal | None:
        bid, ask = self.best_bid, self.best_ask
        if bid is None or ask is None:
            return None
        return ask - bid

    def depth(self, side: OrderSide, levels: int = 5) -> list[PriceLevelView]:
        book = self._side_book(side)
        result: list[PriceLevelView] = []
        for key in book.islice(0, levels):
            queue = book[key]
            total_qty = sum(o.remaining for o in queue)
            result.append(PriceLevelView(
                price=abs(key),
                total_quantity=total_qty,
                order_count=len(queue),
            ))
        return result

    def snapshot(self, depth: int = 10) -> BookSnapshot:
        return BookSnapshot(
            symbol=self.symbol,
            bids=self.depth(OrderSide.BUY, depth),
            asks=self.depth(OrderSide.SELL, depth),
            best_bid=self.best_bid,
            best_ask=self.best_ask,
            spread=self.spread,
            timestamp=datetime.now(timezone.utc),
        )

    def volume_at(self, side: OrderSide, price: Decimal) -> Decimal:
        book = self._side_book(side)
        key = self._price_key(side, price)
        level = book.get(key)
        if level is None:
            return Decimal(0)
        return sum(o.remaining for o in level)

    def __len__(self) -> int:
        return len(self._orders)

    def _side_book(self, side: OrderSide) -> SortedDict:
        return self._bids if side == OrderSide.BUY else self._asks

    def _price_key(self, side: OrderSide, price: Decimal) -> Decimal:
        # Negate bid prices so the highest bid sits at index 0
        return -price if side == OrderSide.BUY else price

    def _pop_best_order(self, side: OrderSide) -> BookOrder | None:
        book = self._side_book(side)
        if not book:
            return None
        key, queue = book.peekitem(0)
        order = queue.popleft()
        self._orders.pop(order.order_id, None)
        if not queue:
            del book[key]
        return order

    def _best_price(self, side: OrderSide) -> Decimal | None:
        book = self._side_book(side)
        if not book:
            return None
        key = book.peekitem(0)[0]
        return abs(key)
