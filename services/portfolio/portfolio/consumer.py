from __future__ import annotations
import json
import logging
import uuid
from collections import deque
from dataclasses import dataclass
from decimal import Decimal
from typing import Any
import redis.asyncio as aioredis
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import async_sessionmaker
from common import (
    CHANNEL_PORTFOLIO_UPDATED,
    EXCHANGE_TRADES,
    Order,
    OrderSide,
    RabbitMQManager,
)
from portfolio.domain import PortfolioState, PositionState
from portfolio.events import TradeExecutedEvent
from portfolio.repository import PortfolioNotFoundError, PortfolioRepository
from portfolio.state import apply_fill_to_portfolio

logger = logging.getLogger(__name__)

QUEUE_PORTFOLIO_TRADES = "portfolio.trades"
BINDING_KEY = "trade.executed.*"
DEDUP_CACHE_SIZE = 10000


@dataclass(frozen=True, slots=True)
class _PortfolioUpdate:
    portfolio_id: uuid.UUID
    cash_balance: Decimal
    symbol: str
    quantity: Decimal
    avg_entry_price: Decimal
    realized_pnl: Decimal
    realized_pnl_delta: Decimal


class _BoundedDedupCache:
    # In-process LRU set sized for short-window redelivery. RabbitMQ retries usually arrive
    # within seconds; persistent cross-restart idempotency is a follow-up concern.
    def __init__(self, maxlen: int = DEDUP_CACHE_SIZE) -> None:
        self._maxlen = maxlen
        self._set: set[uuid.UUID] = set()
        self._order: deque[uuid.UUID] = deque()

    def __contains__(self, item: uuid.UUID) -> bool:
        return item in self._set

    def add(self, item: uuid.UUID) -> None:
        if item in self._set:
            return
        self._order.append(item)
        self._set.add(item)
        while len(self._order) > self._maxlen:
            evicted = self._order.popleft()
            self._set.discard(evicted)


class TradeConsumer:
    def __init__(
        self,
        rmq: RabbitMQManager,
        session_factory: async_sessionmaker,
        redis: aioredis.Redis | None = None,
    ) -> None:
        self._rmq = rmq
        self._session_factory = session_factory
        self._redis = redis
        self._seen = _BoundedDedupCache()

    async def start(self) -> None:
        await self._rmq.consume(
            QUEUE_PORTFOLIO_TRADES,
            EXCHANGE_TRADES,
            BINDING_KEY,
            self._handle,
        )
        logger.info("portfolio trade consumer started")

    async def _handle(self, payload: dict[str, Any]) -> None:
        try:
            event = TradeExecutedEvent.model_validate(payload)
        except ValidationError:
            logger.exception(
                "invalid trade event payload, dropping",
                extra={"payload": payload},
            )
            return
        if event.event_id in self._seen:
            logger.debug(
                "duplicate trade event, skipping",
                extra={"event_id": str(event.event_id)},
            )
            return
        try:
            await self._apply(event)
            self._seen.add(event.event_id)
        except PortfolioNotFoundError:
            logger.exception(
                "portfolio not found for trade event, dropping",
                extra={
                    "event_id": str(event.event_id),
                    "portfolio_id": str(event.portfolio_id),
                },
            )
            return
        except Exception:
            logger.exception(
                "failed to apply trade event",
                extra={
                    "event_id": str(event.event_id),
                    "trade_id": str(event.trade_id),
                },
            )
            raise

    async def _apply(self, event: TradeExecutedEvent) -> None:
        updates: list[_PortfolioUpdate] = []
        async with self._session_factory() as session:
            async with session.begin():
                repo = PortfolioRepository(session)
                updates.append(await self._apply_side(
                    repo, event.portfolio_id, event.symbol, event.side,
                    event.quantity, event.price, event.fee,
                ))
                # Maker side: event only carries the taker's portfolio. We look up the
                # maker's order to find its portfolio and apply the symmetric fill.
                maker_order = await session.get(Order, event.maker_order_id)
                if maker_order is not None:
                    maker_side = (
                        OrderSide.SELL if event.side == OrderSide.BUY else OrderSide.BUY
                    )
                    updates.append(await self._apply_side(
                        repo, maker_order.portfolio_id, event.symbol, maker_side,
                        event.quantity, event.price, event.fee,
                    ))
                else:
                    logger.warning(
                        "maker order not found, taker side applied only",
                        extra={"maker_order_id": str(event.maker_order_id)},
                    )
        # Publish only after the DB transaction commits — clients should never see an update
        # for a trade we then failed to persist.
        for update in updates:
            await self._publish(update)

    async def _apply_side(
        self,
        repo: PortfolioRepository,
        portfolio_id: uuid.UUID,
        symbol: str,
        side: OrderSide,
        qty: Decimal,
        price: Decimal,
        fee: Decimal,
    ) -> _PortfolioUpdate:
        portfolio = await repo.get_portfolio(portfolio_id, for_update=True)
        position = await repo.get_or_create_position(
            portfolio_id, symbol, for_update=True,
        )
        new_portfolio, new_position, realized_delta = apply_fill_to_portfolio(
            portfolio, position, side, qty, price, fee,
        )
        await repo.save_portfolio(new_portfolio)
        await repo.save_position(new_position)
        return _build_update(new_portfolio, new_position, realized_delta)

    async def _publish(self, update: _PortfolioUpdate) -> None:
        if self._redis is None:
            return
        channel = CHANNEL_PORTFOLIO_UPDATED.format(portfolio_id=update.portfolio_id)
        payload = json.dumps({
            "type": "portfolio_update",
            "portfolio_id": str(update.portfolio_id),
            "cash_balance": str(update.cash_balance),
            "position": {
                "symbol": update.symbol,
                "quantity": str(update.quantity),
                "avg_entry_price": str(update.avg_entry_price),
                "realized_pnl": str(update.realized_pnl),
            },
            "realized_pnl_delta": str(update.realized_pnl_delta),
        })
        try:
            await self._redis.publish(channel, payload)
        except Exception:
            logger.warning(
                "failed to publish portfolio update to redis",
                extra={"portfolio_id": str(update.portfolio_id)},
            )


def _build_update(
    portfolio: PortfolioState,
    position: PositionState,
    realized_delta: Decimal,
) -> _PortfolioUpdate:
    return _PortfolioUpdate(
        portfolio_id=portfolio.id,
        cash_balance=portfolio.cash_balance,
        symbol=position.symbol,
        quantity=position.quantity,
        avg_entry_price=position.avg_entry_price,
        realized_pnl=position.realized_pnl,
        realized_pnl_delta=realized_delta,
    )
