from __future__ import annotations
import asyncio
import json
import logging
import uuid
from collections import defaultdict
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any
import redis.asyncio as aioredis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from common import (
    RabbitMQManager,
    EXCHANGE_ORDERS,
    EXCHANGE_TRADES,
    Order,
    Trade,
    Portfolio,
    OrderSide,
    OrderType,
    OrderStatus,
)
from orders.book_types import BookOrder, BookSnapshot, Fill, OrderResult
from orders.engine import MatchingEngine
from orders.events import (
    OrderAccepted,
    OrderFilled,
    OrderRejected,
    OrderCancelled,
    TradeExecuted,
)
from orders.schemas import SubmitOrderRequest, OrderResponse, CancelOrderResponse

logger = logging.getLogger(__name__)

CHANNEL_ORDER_STATUS = "order:status:{portfolio_id}"


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

    async def submit_order(
        self, req: SubmitOrderRequest, session: AsyncSession,
    ) -> OrderResponse:
        portfolio = await session.get(Portfolio, req.portfolio_id)
        if not portfolio or not portfolio.is_active:
            raise PortfolioNotFoundError(req.portfolio_id)
        order_id = uuid.uuid4()
        now = datetime.now(timezone.utc)
        db_order = Order(
            id=order_id,
            portfolio_id=req.portfolio_id,
            symbol=req.symbol,
            side=req.side,
            order_type=req.order_type,
            time_in_force=req.time_in_force,
            quantity=req.quantity,
            price=req.price,
            stop_price=req.stop_price,
            status=OrderStatus.PENDING,
            filled_quantity=Decimal("0"),
        )
        session.add(db_order)
        book_order = BookOrder(
            order_id=order_id,
            symbol=req.symbol,
            side=req.side,
            order_type=req.order_type,
            price=req.price or Decimal("0"),
            quantity=req.quantity,
            remaining=req.quantity,
            timestamp=now,
            time_in_force=req.time_in_force,
            stop_price=req.stop_price,
        )
        maker_updates: list[dict[str, Any]] = []
        async with self._get_lock(req.symbol):
            self._order_portfolios[order_id] = req.portfolio_id
            result = self._get_engine(req.symbol).submit(book_order)
            db_order.status = result.status
            if result.fills:
                maker_updates = await self._process_fills(
                    result, order_id, req, session,
                )
                taker_qty = sum(f.quantity for f in result.fills)
                taker_value = sum(f.quantity * f.price for f in result.fills)
                db_order.filled_quantity = taker_qty
                db_order.average_fill_price = taker_value / taker_qty
            if result.status in (
                OrderStatus.FILLED, OrderStatus.REJECTED, OrderStatus.CANCELLED,
            ):
                self._order_portfolios.pop(order_id, None)
        await session.flush()
        await session.refresh(db_order)
        filled_qty = db_order.filled_quantity
        avg_price = db_order.average_fill_price
        asyncio.create_task(
            self._publish_submit_events(
                req=req,
                order_id=order_id,
                result=result,
                filled_quantity=filled_qty,
                average_fill_price=avg_price,
                maker_updates=maker_updates,
            )
        )
        return OrderResponse.model_validate(db_order)

    async def _process_fills(
        self,
        result: OrderResult,
        taker_order_id: uuid.UUID,
        req: SubmitOrderRequest,
        session: AsyncSession,
    ) -> list[dict[str, Any]]:
        maker_updates: list[dict[str, Any]] = []
        maker_fill_groups: dict[uuid.UUID, list] = defaultdict(list)
        for fill in result.fills:
            maker_fill_groups[fill.maker_order_id].append(fill)
        maker_ids = list(maker_fill_groups.keys())
        stmt = select(Order).where(Order.id.in_(maker_ids))
        rows = await session.execute(stmt)
        maker_orders = {o.id: o for o in rows.scalars().all()}
        for fill in result.fills:
            session.add(Trade(
                order_id=taker_order_id,
                portfolio_id=req.portfolio_id,
                symbol=req.symbol,
                side=req.side,
                quantity=fill.quantity,
                price=fill.price,
                fee=Decimal("0"),
                executed_at=fill.timestamp,
            ))
            maker_portfolio = self._order_portfolios.get(fill.maker_order_id)
            if maker_portfolio:
                maker_side = (
                    OrderSide.SELL if req.side == OrderSide.BUY else OrderSide.BUY
                )
                session.add(Trade(
                    order_id=fill.maker_order_id,
                    portfolio_id=maker_portfolio,
                    symbol=req.symbol,
                    side=maker_side,
                    quantity=fill.quantity,
                    price=fill.price,
                    fee=Decimal("0"),
                    executed_at=fill.timestamp,
                ))
        for maker_id, fills in maker_fill_groups.items():
            maker = maker_orders.get(maker_id)
            if not maker:
                logger.warning(
                    "maker order not found in DB during fill processing",
                    extra={"maker_order_id": str(maker_id)},
                )
                continue
            batch_qty = sum(f.quantity for f in fills)
            batch_value = sum(f.quantity * f.price for f in fills)
            old_filled = maker.filled_quantity or Decimal("0")
            old_value = (maker.average_fill_price or Decimal("0")) * old_filled
            maker.filled_quantity = old_filled + batch_qty
            maker.average_fill_price = (old_value + batch_value) / maker.filled_quantity
            if maker.filled_quantity >= maker.quantity:
                maker.status = OrderStatus.FILLED
                self._order_portfolios.pop(maker_id, None)
            else:
                maker.status = OrderStatus.PARTIALLY_FILLED
            maker_updates.append({
                "order_id": maker_id,
                "portfolio_id": maker.portfolio_id,
                "symbol": maker.symbol,
                "status": maker.status,
                "filled_quantity": maker.filled_quantity,
                "average_fill_price": maker.average_fill_price,
            })
        return maker_updates

    async def cancel_order(
        self,
        order_id: uuid.UUID,
        portfolio_id: uuid.UUID,
        session: AsyncSession,
    ) -> CancelOrderResponse:
        db_order = await session.get(Order, order_id)
        if not db_order or db_order.portfolio_id != portfolio_id:
            raise OrderNotFoundError(order_id)
        cancellable = {
            OrderStatus.OPEN, OrderStatus.PARTIALLY_FILLED, OrderStatus.PENDING,
        }
        if db_order.status not in cancellable:
            raise OrderNotCancellableError(order_id, db_order.status)
        async with self._get_lock(db_order.symbol):
            self._get_engine(db_order.symbol).cancel(order_id)
            self._order_portfolios.pop(order_id, None)
        remaining = db_order.quantity - (db_order.filled_quantity or Decimal("0"))
        db_order.status = OrderStatus.CANCELLED
        await session.flush()
        cancel_portfolio = db_order.portfolio_id
        cancel_symbol = db_order.symbol
        cancel_filled = db_order.filled_quantity or Decimal("0")
        cancel_avg = db_order.average_fill_price
        asyncio.create_task(
            self._publish_cancel_event(
                order_id=order_id,
                portfolio_id=cancel_portfolio,
                symbol=cancel_symbol,
                remaining=remaining,
                filled_quantity=cancel_filled,
                average_fill_price=cancel_avg,
            )
        )
        return CancelOrderResponse(
            order_id=order_id,
            status=OrderStatus.CANCELLED,
            remaining_quantity=remaining,
        )

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


    # ------------------------------------------------------------------
    # Event publishing (fire-and-forget)
    # ------------------------------------------------------------------

    async def _publish_submit_events(
        self,
        *,
        req: SubmitOrderRequest,
        order_id: uuid.UUID,
        result: OrderResult,
        filled_quantity: Decimal,
        average_fill_price: Decimal | None,
        maker_updates: list[dict[str, Any]],
    ) -> None:
        try:
            if result.status == OrderStatus.REJECTED:
                evt = OrderRejected(
                    order_id=order_id,
                    portfolio_id=req.portfolio_id,
                    symbol=req.symbol,
                    side=req.side,
                    order_type=req.order_type,
                    reason=result.reject_reason,
                )
                await self._rmq.publish(
                    EXCHANGE_ORDERS, evt.routing_key, evt.model_dump(mode="json"),
                )
            else:
                accepted = OrderAccepted(
                    order_id=order_id,
                    portfolio_id=req.portfolio_id,
                    symbol=req.symbol,
                    side=req.side,
                    order_type=req.order_type,
                    time_in_force=req.time_in_force,
                    quantity=req.quantity,
                    price=req.price,
                    stop_price=req.stop_price,
                )
                await self._rmq.publish(
                    EXCHANGE_ORDERS,
                    accepted.routing_key,
                    accepted.model_dump(mode="json"),
                )
                if result.status == OrderStatus.FILLED:
                    filled_evt = OrderFilled(
                        order_id=order_id,
                        portfolio_id=req.portfolio_id,
                        symbol=req.symbol,
                        side=req.side,
                        filled_quantity=filled_quantity,
                        average_fill_price=average_fill_price or Decimal("0"),
                    )
                    await self._rmq.publish(
                        EXCHANGE_ORDERS,
                        filled_evt.routing_key,
                        filled_evt.model_dump(mode="json"),
                    )
                for fill in result.fills:
                    trade_evt = TradeExecuted(
                        order_id=order_id,
                        portfolio_id=req.portfolio_id,
                        symbol=req.symbol,
                        side=req.side,
                        quantity=fill.quantity,
                        price=fill.price,
                        maker_order_id=fill.maker_order_id,
                        taker_order_id=fill.taker_order_id,
                    )
                    await self._rmq.publish(
                        EXCHANGE_TRADES,
                        trade_evt.routing_key,
                        trade_evt.model_dump(mode="json"),
                    )
            await self._publish_order_status(
                order_id=order_id,
                portfolio_id=req.portfolio_id,
                symbol=req.symbol,
                status=result.status,
                filled_quantity=filled_quantity,
                average_fill_price=average_fill_price,
            )
            for update in maker_updates:
                await self._publish_order_status(
                    order_id=update["order_id"],
                    portfolio_id=update["portfolio_id"],
                    symbol=update["symbol"],
                    status=update["status"],
                    filled_quantity=update["filled_quantity"],
                    average_fill_price=update["average_fill_price"],
                )
        except Exception:
            logger.exception("failed to publish order submission events")

    async def _publish_cancel_event(
        self,
        *,
        order_id: uuid.UUID,
        portfolio_id: uuid.UUID,
        symbol: str,
        remaining: Decimal,
        filled_quantity: Decimal,
        average_fill_price: Decimal | None,
    ) -> None:
        try:
            evt = OrderCancelled(
                order_id=order_id,
                portfolio_id=portfolio_id,
                symbol=symbol,
                remaining_quantity=remaining,
            )
            await self._rmq.publish(
                EXCHANGE_ORDERS, evt.routing_key, evt.model_dump(mode="json"),
            )
            await self._publish_order_status(
                order_id=order_id,
                portfolio_id=portfolio_id,
                symbol=symbol,
                status=OrderStatus.CANCELLED,
                filled_quantity=filled_quantity,
                average_fill_price=average_fill_price,
            )
        except Exception:
            logger.exception("failed to publish cancel event")

    async def _publish_order_status(
        self,
        *,
        order_id: uuid.UUID,
        portfolio_id: uuid.UUID,
        symbol: str,
        status: OrderStatus,
        filled_quantity: Decimal | None,
        average_fill_price: Decimal | None,
    ) -> None:
        if not self._redis:
            return
        channel = CHANNEL_ORDER_STATUS.format(portfolio_id=portfolio_id)
        payload = json.dumps({
            "type": "order_update",
            "order_id": str(order_id),
            "portfolio_id": str(portfolio_id),
            "symbol": symbol,
            "status": status.value,
            "filled_quantity": str(filled_quantity or 0),
            "average_fill_price": str(average_fill_price or 0),
        })
        try:
            await self._redis.publish(channel, payload)
        except Exception:
            logger.warning(
                "failed to publish order status to redis",
                extra={"order_id": str(order_id)},
            )


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
