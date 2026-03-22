from __future__ import annotations
import asyncio
import json
import logging
import os
from typing import Any, Callable, Awaitable
import aio_pika
from aio_pika import ExchangeType, Message, DeliveryMode
from aio_pika.abc import (
    AbstractRobustConnection,
    AbstractRobustChannel,
    AbstractRobustExchange,
    AbstractRobustQueue,
)

logger = logging.getLogger(__name__)

EXCHANGE_ORDERS = "orders.events"
EXCHANGE_TRADES = "trades.events"
MAX_RECONNECT_DELAY = 30
INITIAL_RECONNECT_DELAY = 1

EventCallback = Callable[[dict[str, Any]], Awaitable[None]]


class RabbitMQManager:
    """Manages a single AMQP connection with automatic reconnection
    and provides publish/consume primitives over topic exchanges."""

    def __init__(self, url: str | None = None):
        self._url = url or os.getenv("RABBITMQ_URL", "")
        self._connection: AbstractRobustConnection | None = None
        self._channel: AbstractRobustChannel | None = None
        self._exchanges: dict[str, AbstractRobustExchange] = {}
        self._reconnect_delay = INITIAL_RECONNECT_DELAY
        self._lock = asyncio.Lock()

    @property
    def connected(self) -> bool:
        return (
            self._connection is not None
            and not self._connection.is_closed
            and self._channel is not None
            and not self._channel.is_closed
        )

    async def connect(self) -> None:
        if self.connected:
            return
        self._connection = await aio_pika.connect_robust(self._url)
        self._channel = await self._connection.channel()
        await self._channel.set_qos(prefetch_count=10)
        await self._declare_topology()
        logger.info("rabbitmq connected", extra={"component": "rabbitmq"})

    async def _declare_topology(self) -> None:
        if not self._channel:
            return
        for name in (EXCHANGE_ORDERS, EXCHANGE_TRADES):
            exchange = await self._channel.declare_exchange(
                name,
                ExchangeType.TOPIC,
                durable=True,
            )
            self._exchanges[name] = exchange

    async def close(self) -> None:
        if self._channel and not self._channel.is_closed:
            await self._channel.close()
        if self._connection and not self._connection.is_closed:
            await self._connection.close()
        self._channel = None
        self._connection = None
        self._exchanges.clear()
        logger.info("rabbitmq connection closed", extra={"component": "rabbitmq"})
