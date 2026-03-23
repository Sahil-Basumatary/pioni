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
        async with self._lock:
            if self.connected:
                return
            await self._connect_with_retry()

    async def _connect_with_retry(self) -> None:
        while True:
            try:
                self._connection = await aio_pika.connect_robust(self._url)
                self._channel = await self._connection.channel()
                await self._channel.set_qos(prefetch_count=10)
                await self._declare_topology()
                self._reconnect_delay = INITIAL_RECONNECT_DELAY
                logger.info(
                    "rabbitmq connected",
                    extra={"component": "rabbitmq"},
                )
                return
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception(
                    "rabbitmq connection failed, retrying",
                    extra={
                        "component": "rabbitmq",
                        "delay_s": self._reconnect_delay,
                    },
                )
                await asyncio.sleep(self._reconnect_delay)
                self._reconnect_delay = min(
                    self._reconnect_delay * 2, MAX_RECONNECT_DELAY
                )

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

    async def publish(
        self,
        exchange_name: str,
        routing_key: str,
        body: dict[str, Any],
        *,
        persistent: bool = True,
    ) -> None:
        if not self.connected:
            await self.connect()
        exchange = self._exchanges.get(exchange_name)
        if not exchange:
            raise ValueError(f"unknown exchange: {exchange_name}")
        message = Message(
            body=json.dumps(body, default=str).encode(),
            content_type="application/json",
            delivery_mode=(
                DeliveryMode.PERSISTENT if persistent else DeliveryMode.NOT_PERSISTENT
            ),
        )
        await exchange.publish(message, routing_key=routing_key)
        logger.debug(
            "published event",
            extra={
                "component": "rabbitmq",
                "exchange": exchange_name,
                "routing_key": routing_key,
            },
        )

    async def declare_queue(
        self,
        queue_name: str,
        exchange_name: str,
        binding_key: str,
        *,
        durable: bool = True,
    ) -> AbstractRobustQueue:
        """Declare a queue and bind it to an exchange.
        Consumers call this to set up their own queues."""
        if not self.connected:
            await self.connect()
        if not self._channel:
            raise RuntimeError("channel not available")
        queue = await self._channel.declare_queue(queue_name, durable=durable)
        exchange = self._exchanges.get(exchange_name)
        if not exchange:
            raise ValueError(f"unknown exchange: {exchange_name}")
        await queue.bind(exchange, routing_key=binding_key)
        logger.info(
            "queue declared and bound",
            extra={
                "component": "rabbitmq",
                "queue": queue_name,
                "exchange": exchange_name,
                "binding_key": binding_key,
            },
        )
        return queue

    async def consume(
        self,
        queue_name: str,
        exchange_name: str,
        binding_key: str,
        callback: EventCallback,
    ) -> None:
        """Declare a queue, bind it, and start consuming messages."""
        queue = await self.declare_queue(
            queue_name, exchange_name, binding_key
        )

        async def _on_message(
            message: aio_pika.abc.AbstractIncomingMessage,
        ) -> None:
            async with message.process():
                try:
                    data = json.loads(message.body.decode())
                    await callback(data)
                except Exception:
                    logger.exception(
                        "failed to process message",
                        extra={
                            "component": "rabbitmq",
                            "queue": queue_name,
                            "routing_key": message.routing_key,
                        },
                    )

        await queue.consume(_on_message)
        logger.info(
            "consumer started",
            extra={
                "component": "rabbitmq",
                "queue": queue_name,
                "binding_key": binding_key,
            },
        )

    async def close(self) -> None:
        if self._channel and not self._channel.is_closed:
            await self._channel.close()
        if self._connection and not self._connection.is_closed:
            await self._connection.close()
        self._channel = None
        self._connection = None
        self._exchanges.clear()
        logger.info("rabbitmq connection closed", extra={"component": "rabbitmq"})
