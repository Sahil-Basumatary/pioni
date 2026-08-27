from __future__ import annotations
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from common import OrderSide, OrderType, OrderStatus, TimeInForce
from orders.book_types import BookOrder, _FastFill, _FastResult, RejectReason
from orders.orderbook import OrderBook


class MatchingEngine:
    """Single-threaded matcher; persistence and events live in OrderService."""

    __slots__ = ("symbol", "_book", "_stops", "_last_trade_price")

    def __init__(self, symbol: str) -> None:
        self.symbol = symbol
        self._book = OrderBook(symbol)
        self._stops: dict[uuid.UUID, BookOrder] = {}
        self._last_trade_price: Decimal | None = None

    @property
    def book(self) -> OrderBook:
        return self._book

    @property
    def last_trade_price(self) -> Decimal | None:
        return self._last_trade_price

    def submit(self, order: BookOrder) -> _FastResult:
        if order.quantity <= 0 or order.remaining <= 0:
            return _FastResult(
                order_id=order.order_id,
                status=OrderStatus.REJECTED,
                remaining_quantity=order.remaining,
                reject_reason=RejectReason.INVALID_QUANTITY,
            )
        otype = order.order_type
        if otype == OrderType.LIMIT:
            return self._execute_limit(order)
        if otype == OrderType.MARKET:
            return self._execute_market(order)
        return self._register_stop(order)

    def cancel(self, order_id: uuid.UUID) -> BookOrder | None:
        stop = self._stops.pop(order_id, None)
        if stop is not None:
            return stop
        return self._book.cancel(order_id)

    def check_stops(self, market_price: Decimal) -> list[_FastResult]:
        """Scan registered stops and execute any whose threshold is crossed.

        Does not cascade — triggered stops that produce fills won't
        re-check remaining stops in the same pass.
        """
        triggered: list[uuid.UUID] = []
        for oid, stop in self._stops.items():
            if stop.side == OrderSide.SELL and market_price <= stop.stop_price:
                triggered.append(oid)
            elif stop.side == OrderSide.BUY and market_price >= stop.stop_price:
                triggered.append(oid)
        results: list[_FastResult] = []
        for oid in triggered:
            order = self._stops.pop(oid)
            order.order_type = OrderType.MARKET
            results.append(self._execute_market(order))
        return results

    def _execute_market(self, order: BookOrder) -> _FastResult:
        fills = self._match(order)
        if not fills:
            return _FastResult(
                order_id=order.order_id,
                status=OrderStatus.REJECTED,
                remaining_quantity=order.remaining,
                reject_reason=RejectReason.NO_LIQUIDITY,
            )
        status = OrderStatus.FILLED if order.remaining <= 0 else OrderStatus.PARTIALLY_FILLED
        return _FastResult(
            order_id=order.order_id,
            status=status,
            remaining_quantity=order.remaining,
            fills=fills,
        )

    def _execute_limit(self, order: BookOrder) -> _FastResult:
        fills = self._match(order, price_limit=order.price)
        if order.remaining > 0:
            if order.time_in_force == TimeInForce.GTC:
                self._book.add(order)
                status = OrderStatus.PARTIALLY_FILLED if fills else OrderStatus.OPEN
            else:
                status = OrderStatus.PARTIALLY_FILLED if fills else OrderStatus.CANCELLED
        else:
            status = OrderStatus.FILLED
        return _FastResult(
            order_id=order.order_id,
            status=status,
            remaining_quantity=order.remaining,
            fills=fills,
        )

    def _register_stop(self, order: BookOrder) -> _FastResult:
        if order.stop_price is None:
            return _FastResult(
                order_id=order.order_id,
                status=OrderStatus.REJECTED,
                remaining_quantity=order.remaining,
                reject_reason=RejectReason.INVALID_PRICE,
            )
        self._stops[order.order_id] = order
        return _FastResult(
            order_id=order.order_id,
            status=OrderStatus.OPEN,
            remaining_quantity=order.remaining,
        )

    def _match(
        self, order: BookOrder, price_limit: Decimal | None = None,
    ) -> list[_FastFill]:
        """Walk the opposite side of the book, filling aggressively.

        Resting orders are modified in-place and only removed when fully
        consumed, preserving FIFO time-priority within each price level.
        """
        opposite = OrderSide.SELL if order.side == OrderSide.BUY else OrderSide.BUY
        side_book = self._book._side_book(opposite)
        if not side_book:
            return []
        is_buy = order.side == OrderSide.BUY
        orders_map = self._book._orders
        taker_id = order.order_id
        remaining = order.remaining
        now = datetime.now(timezone.utc)
        fills: list[_FastFill] = []
        if price_limit is None:
            while remaining > 0:
                if not side_book:
                    break
                key, queue = side_book.peekitem(0)
                resting_price = abs(key)
                resting = queue[0]
                r_remaining = resting.remaining
                if remaining < r_remaining:
                    fill_qty = remaining
                else:
                    fill_qty = r_remaining
                fills.append(_FastFill(
                    resting.order_id, taker_id, resting_price, fill_qty, now,
                ))
                remaining -= fill_qty
                resting.remaining -= fill_qty
                if resting.remaining <= 0:
                    queue.popleft()
                    orders_map.pop(resting.order_id, None)
                    if not queue:
                        del side_book[key]
        else:
            while remaining > 0:
                if not side_book:
                    break
                key, queue = side_book.peekitem(0)
                resting_price = abs(key)
                if is_buy and resting_price > price_limit:
                    break
                if not is_buy and resting_price < price_limit:
                    break
                resting = queue[0]
                r_remaining = resting.remaining
                if remaining < r_remaining:
                    fill_qty = remaining
                else:
                    fill_qty = r_remaining
                fills.append(_FastFill(
                    resting.order_id, taker_id, resting_price, fill_qty, now,
                ))
                remaining -= fill_qty
                resting.remaining -= fill_qty
                if resting.remaining <= 0:
                    queue.popleft()
                    orders_map.pop(resting.order_id, None)
                    if not queue:
                        del side_book[key]
        order.remaining = remaining
        if fills:
            self._last_trade_price = fills[-1].price
        return fills
