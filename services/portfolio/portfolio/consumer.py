from __future__ import annotations
import logging
import uuid
from collections import deque
from typing import Any
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import async_sessionmaker
from common import EXCHANGE_TRADES, RabbitMQManager
from portfolio.events import TradeExecutedEvent
from portfolio.repository import PortfolioNotFoundError, PortfolioRepository
from portfolio.state import apply_fill_to_portfolio

logger = logging.getLogger(__name__)

QUEUE_PORTFOLIO_TRADES = "portfolio.trades"
BINDING_KEY = "trade.executed.*"
DEDUP_CACHE_SIZE = 10000


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
    ) -> None:
        self._rmq = rmq
        self._session_factory = session_factory
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
        async with self._session_factory() as session:
            async with session.begin():
                repo = PortfolioRepository(session)
                portfolio = await repo.get_portfolio(
                    event.portfolio_id, for_update=True,
                )
                position = await repo.get_or_create_position(
                    event.portfolio_id, event.symbol, for_update=True,
                )
                new_portfolio, new_position, _ = apply_fill_to_portfolio(
                    portfolio, position, event.side,
                    event.quantity, event.price, event.fee,
                )
                await repo.save_portfolio(new_portfolio)
                await repo.save_position(new_position)
