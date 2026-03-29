from __future__ import annotations
import asyncio
import logging
import uuid
from decimal import Decimal
import redis.asyncio as aioredis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from common import (
    RabbitMQManager,
    Order,
    Portfolio,
    OrderType,
    OrderStatus,
)
from orders.book_types import BookOrder, BookSnapshot
from orders.engine import MatchingEngine
from orders.schemas import OrderResponse

logger = logging.getLogger(__name__)


class OrderError(Exception):
    def __init__(self, message: str, code: str = "ORDER_ERROR"):
        self.message = message
        self.code = code
        super().__init__(message)


class PortfolioNotFoundError(OrderError):
    def __init__(self, portfolio_id: uuid.UUID):
        super().__init__(
            f"portfolio {portfolio_id} not found or inactive",
            code="PORTFOLIO_NOT_FOUND",
        )


class OrderNotFoundError(OrderError):
    def __init__(self, order_id: uuid.UUID):
        super().__init__(
            f"order {order_id} not found",
            code="ORDER_NOT_FOUND",
        )


class OrderNotCancellableError(OrderError):
    def __init__(self, order_id: uuid.UUID, status: OrderStatus):
        super().__init__(
            f"order {order_id} cannot be cancelled (status={status.value})",
            code="ORDER_NOT_CANCELLABLE",
        )


class OrderService:
    def __init__(
        self,
        rmq: RabbitMQManager,
        redis: aioredis.Redis | None = None,
    ) -> None:
        self._engines: dict[str, MatchingEngine] = {}
        self._rmq = rmq
        self._redis = redis
        self._order_portfolios: dict[uuid.UUID, uuid.UUID] = {}
        self._symbol_locks: dict[str, asyncio.Lock] = {}

    def _get_engine(self, symbol: str) -> MatchingEngine:
        if symbol not in self._engines:
            self._engines[symbol] = MatchingEngine(symbol)
        return self._engines[symbol]

    def _get_lock(self, symbol: str) -> asyncio.Lock:
        if symbol not in self._symbol_locks:
            self._symbol_locks[symbol] = asyncio.Lock()
        return self._symbol_locks[symbol]

    async def get_order(
        self,
        order_id: uuid.UUID,
        portfolio_id: uuid.UUID,
        session: AsyncSession,
    ) -> OrderResponse:
        db_order = await session.get(Order, order_id)
        if not db_order or db_order.portfolio_id != portfolio_id:
            raise OrderNotFoundError(order_id)
        return OrderResponse.model_validate(db_order)

    async def list_orders(
        self,
        portfolio_id: uuid.UUID,
        session: AsyncSession,
        *,
        symbol: str | None = None,
        status: OrderStatus | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[OrderResponse]:
        stmt = select(Order).where(Order.portfolio_id == portfolio_id)
        if symbol:
            stmt = stmt.where(Order.symbol == symbol.upper())
        if status:
            stmt = stmt.where(Order.status == status)
        stmt = stmt.order_by(Order.created_at.desc()).limit(limit).offset(offset)
        rows = await session.execute(stmt)
        return [OrderResponse.model_validate(o) for o in rows.scalars().all()]

    def get_orderbook(self, symbol: str, depth: int = 10) -> BookSnapshot:
        engine = self._get_engine(symbol.upper())
        return engine.book.snapshot(depth)

    async def restore_books(self, session: AsyncSession) -> int:
        stmt = select(Order).where(
            Order.status.in_([OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED])
        )
        rows = await session.execute(stmt)
        orders = rows.scalars().all()
        count = 0
        for order in orders:
            remaining = order.quantity - (order.filled_quantity or Decimal("0"))
            if remaining <= 0:
                continue
            book_order = BookOrder(
                order_id=order.id,
                symbol=order.symbol,
                side=order.side,
                order_type=order.order_type,
                price=order.price or Decimal("0"),
                quantity=order.quantity,
                remaining=remaining,
                timestamp=order.created_at,
                time_in_force=order.time_in_force,
                stop_price=order.stop_price,
            )
            engine = self._get_engine(order.symbol)
            if order.order_type == OrderType.STOP_LOSS:
                engine._stops[order.id] = book_order
            else:
                engine.book.add(book_order)
            self._order_portfolios[order.id] = order.portfolio_id
            count += 1
        logger.info(
            "restored order books from database",
            extra={"restored_count": count},
        )
        return count


_service: OrderService | None = None


def init_order_service(
    rmq: RabbitMQManager, redis: aioredis.Redis | None = None,
) -> OrderService:
    global _service
    _service = OrderService(rmq, redis)
    return _service


def get_order_service() -> OrderService:
    if _service is None:
        raise RuntimeError("OrderService not initialized — call init_order_service first")
    return _service
