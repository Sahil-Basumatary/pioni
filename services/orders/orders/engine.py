from __future__ import annotations
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from common import OrderSide, OrderType, OrderStatus, TimeInForce
from orders.book_types import BookOrder, Fill, OrderResult, RejectReason
from orders.orderbook import OrderBook


class MatchingEngine:
    """Single-symbol matching engine with market, limit, and stop-loss support.

    Pure domain logic — no persistence, no event publishing. Designed for
    single-threaded in-memory use (paper trading). Production-grade
    concurrency and persistence are layered on top separately.
    """

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

    def submit(self, order: BookOrder) -> OrderResult:
        if order.quantity <= 0 or order.remaining <= 0:
            return OrderResult(
                order_id=order.order_id,
                status=OrderStatus.REJECTED,
                remaining_quantity=order.remaining,
                reject_reason=RejectReason.INVALID_QUANTITY,
            )
        handlers = {
            OrderType.MARKET: self._execute_market,
            OrderType.LIMIT: self._execute_limit,
            OrderType.STOP_LOSS: self._register_stop,
        }
        return handlers[order.order_type](order)

    def cancel(self, order_id: uuid.UUID) -> BookOrder | None:
        stop = self._stops.pop(order_id, None)
        if stop is not None:
            return stop
        return self._book.cancel(order_id)

    def check_stops(self, market_price: Decimal) -> list[OrderResult]:
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
        results: list[OrderResult] = []
        for oid in triggered:
            order = self._stops.pop(oid)
            order.order_type = OrderType.MARKET
            results.append(self._execute_market(order))
        return results

    # ------------------------------------------------------------------
    # Order-type handlers
    # ------------------------------------------------------------------

    def _execute_market(self, order: BookOrder) -> OrderResult:
        fills = self._match(order)
        if not fills:
            return OrderResult(
                order_id=order.order_id,
                status=OrderStatus.REJECTED,
                remaining_quantity=order.remaining,
                reject_reason=RejectReason.NO_LIQUIDITY,
            )
        status = OrderStatus.FILLED if order.remaining <= 0 else OrderStatus.PARTIALLY_FILLED
        return OrderResult(
            order_id=order.order_id,
            status=status,
            fills=fills,
            remaining_quantity=order.remaining,
        )

    def _execute_limit(self, order: BookOrder) -> OrderResult:
        fills = self._match(order, price_limit=order.price)
        if order.remaining > 0:
            if order.time_in_force == TimeInForce.GTC:
                self._book.add(order)
                status = OrderStatus.PARTIALLY_FILLED if fills else OrderStatus.OPEN
            else:
                status = OrderStatus.PARTIALLY_FILLED if fills else OrderStatus.CANCELLED
        else:
            status = OrderStatus.FILLED
        return OrderResult(
            order_id=order.order_id,
            status=status,
            fills=fills,
            remaining_quantity=order.remaining,
        )

    def _register_stop(self, order: BookOrder) -> OrderResult:
        if order.stop_price is None:
            return OrderResult(
                order_id=order.order_id,
                status=OrderStatus.REJECTED,
                remaining_quantity=order.remaining,
                reject_reason=RejectReason.INVALID_PRICE,
            )
        self._stops[order.order_id] = order
        return OrderResult(
            order_id=order.order_id,
            status=OrderStatus.OPEN,
            remaining_quantity=order.remaining,
        )

    # ------------------------------------------------------------------
    # Core matching loop
    # ------------------------------------------------------------------

    def _match(
        self, order: BookOrder, price_limit: Decimal | None = None,
    ) -> list[Fill]:
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
        fills: list[Fill] = []
        while remaining > 0:
            if not side_book:
                break
            key, queue = side_book.peekitem(0)
            resting_price = abs(key)
            if price_limit is not None:
                if is_buy and resting_price > price_limit:
                    break
                if not is_buy and resting_price < price_limit:
                    break
            resting = queue[0]
            fill_qty = min(remaining, resting.remaining)
            fills.append(Fill(
                maker_order_id=resting.order_id,
                taker_order_id=taker_id,
                price=resting_price,
                quantity=fill_qty,
                timestamp=now,
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
