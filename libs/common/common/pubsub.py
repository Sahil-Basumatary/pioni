from __future__ import annotations
import asyncio
import json
import logging
from typing import Callable, Awaitable
import redis.asyncio as aioredis

logger = logging.getLogger(__name__)

CHANNEL_TRADE = "market:trade:{symbol}"
CHANNEL_KLINE = "market:kline:{symbol}:{interval}"
CHANNEL_TRADE_PATTERN = "market:trade:*"
CHANNEL_KLINE_PATTERN = "market:kline:*:*"
CHANNEL_ORDER_STATUS = "order:status:{portfolio_id}"
CHANNEL_ORDER_STATUS_PATTERN = "order:status:*"
CHANNEL_PORTFOLIO_UPDATED = "portfolio:updated:{portfolio_id}"
CHANNEL_PORTFOLIO_UPDATED_PATTERN = "portfolio:updated:*"
MAX_RECONNECT_DELAY = 30
INITIAL_RECONNECT_DELAY = 1

TradeCallback = Callable[[str, dict], Awaitable[None]]
KlineCallback = Callable[[str, str, dict], Awaitable[None]]
OrderStatusCallback = Callable[[str, dict], Awaitable[None]]
PortfolioUpdateCallback = Callable[[str, dict], Awaitable[None]]


class MarketSubscriber:
    def __init__(
        self,
        redis: aioredis.Redis,
        on_trade: TradeCallback | None = None,
        on_kline: KlineCallback | None = None,
    ):
        self._redis = redis
        self._on_trade = on_trade
        self._on_kline = on_kline
        self._running = False
        self._task: asyncio.Task | None = None
        self._reconnect_delay = INITIAL_RECONNECT_DELAY

    @property
    def running(self) -> bool:
        return self._running and self._task is not None and not self._task.done()

    async def _dispatch(self, message: dict) -> None:
        if message["type"] != "pmessage":
            return
        channel: str = message["channel"]
        try:
            data = json.loads(message["data"])
        except (json.JSONDecodeError, TypeError):
            return
        parts = channel.split(":")
        if len(parts) == 3 and parts[1] == "trade":
            if self._on_trade:
                await self._on_trade(parts[2], data)
        elif len(parts) == 4 and parts[1] == "kline":
            if self._on_kline:
                await self._on_kline(parts[2], parts[3], data)

    async def _listen_loop(self) -> None:
        while self._running:
            pubsub = None
            try:
                pubsub = self._redis.pubsub()
                await pubsub.psubscribe(CHANNEL_TRADE_PATTERN, CHANNEL_KLINE_PATTERN)
                self._reconnect_delay = INITIAL_RECONNECT_DELAY
                logger.info("subscribed to market data channels")
                while self._running:
                    msg = await pubsub.get_message(
                        ignore_subscribe_messages=True, timeout=1.0
                    )
                    if msg:
                        await self._dispatch(msg)
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception("market subscriber error")
            finally:
                if pubsub:
                    try:
                        await pubsub.punsubscribe()
                        await pubsub.aclose()
                    except Exception:
                        pass
            if self._running:
                logger.info(
                    "reconnecting market subscriber",
                    extra={"delay_s": self._reconnect_delay},
                )
                await asyncio.sleep(self._reconnect_delay)
                self._reconnect_delay = min(
                    self._reconnect_delay * 2, MAX_RECONNECT_DELAY
                )

    async def start(self) -> None:
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._listen_loop())

    async def stop(self) -> None:
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None
        logger.info("market subscriber stopped")


class OrderSubscriber:
    def __init__(
        self,
        redis: aioredis.Redis,
        on_order_status: OrderStatusCallback,
    ):
        self._redis = redis
        self._on_order_status = on_order_status
        self._running = False
        self._task: asyncio.Task | None = None
        self._reconnect_delay = INITIAL_RECONNECT_DELAY

    @property
    def running(self) -> bool:
        return self._running and self._task is not None and not self._task.done()

    async def _dispatch(self, message: dict) -> None:
        if message["type"] != "pmessage":
            return
        channel: str = message["channel"]
        try:
            data = json.loads(message["data"])
        except (json.JSONDecodeError, TypeError):
            return
        parts = channel.split(":")
        if len(parts) == 3 and parts[0] == "order" and parts[1] == "status":
            await self._on_order_status(parts[2], data)

    async def _listen_loop(self) -> None:
        while self._running:
            pubsub = None
            try:
                pubsub = self._redis.pubsub()
                await pubsub.psubscribe(CHANNEL_ORDER_STATUS_PATTERN)
                self._reconnect_delay = INITIAL_RECONNECT_DELAY
                logger.info("subscribed to order status channels")
                while self._running:
                    msg = await pubsub.get_message(
                        ignore_subscribe_messages=True, timeout=1.0
                    )
                    if msg:
                        await self._dispatch(msg)
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception("order subscriber error")
            finally:
                if pubsub:
                    try:
                        await pubsub.punsubscribe()
                        await pubsub.aclose()
                    except Exception:
                        pass
            if self._running:
                logger.info(
                    "reconnecting order subscriber",
                    extra={"delay_s": self._reconnect_delay},
                )
                await asyncio.sleep(self._reconnect_delay)
                self._reconnect_delay = min(
                    self._reconnect_delay * 2, MAX_RECONNECT_DELAY
                )

    async def start(self) -> None:
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._listen_loop())

    async def stop(self) -> None:
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None
        logger.info("order subscriber stopped")


class PortfolioSubscriber:
    def __init__(
        self,
        redis: aioredis.Redis,
        on_portfolio_update: PortfolioUpdateCallback,
    ):
        self._redis = redis
        self._on_portfolio_update = on_portfolio_update
        self._running = False
        self._task: asyncio.Task | None = None
        self._reconnect_delay = INITIAL_RECONNECT_DELAY

    @property
    def running(self) -> bool:
        return self._running and self._task is not None and not self._task.done()

    async def _dispatch(self, message: dict) -> None:
        if message["type"] != "pmessage":
            return
        channel: str = message["channel"]
        try:
            data = json.loads(message["data"])
        except (json.JSONDecodeError, TypeError):
            return
        parts = channel.split(":")
        if len(parts) == 3 and parts[0] == "portfolio" and parts[1] == "updated":
            await self._on_portfolio_update(parts[2], data)

    async def _listen_loop(self) -> None:
        while self._running:
            pubsub = None
            try:
                pubsub = self._redis.pubsub()
                await pubsub.psubscribe(CHANNEL_PORTFOLIO_UPDATED_PATTERN)
                self._reconnect_delay = INITIAL_RECONNECT_DELAY
                logger.info("subscribed to portfolio update channels")
                while self._running:
                    msg = await pubsub.get_message(
                        ignore_subscribe_messages=True, timeout=1.0
                    )
                    if msg:
                        await self._dispatch(msg)
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception("portfolio subscriber error")
            finally:
                if pubsub:
                    try:
                        await pubsub.punsubscribe()
                        await pubsub.aclose()
                    except Exception:
                        pass
            if self._running:
                logger.info(
                    "reconnecting portfolio subscriber",
                    extra={"delay_s": self._reconnect_delay},
                )
                await asyncio.sleep(self._reconnect_delay)
                self._reconnect_delay = min(
                    self._reconnect_delay * 2, MAX_RECONNECT_DELAY
                )

    async def start(self) -> None:
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._listen_loop())

    async def stop(self) -> None:
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None
        logger.info("portfolio subscriber stopped")
