import asyncio
import json
import logging
import ssl
from decimal import Decimal
from typing import Awaitable, Callable
import certifi
import websockets
from market_data.schemas import NormalizedTrade, NormalizedKline
from market_data.settings import binance_ws_url

logger = logging.getLogger(__name__)

MAX_RECONNECT_DELAY = 60
INITIAL_RECONNECT_DELAY = 1


class BinanceWSClient:
    def __init__(
        self,
        symbols: list[str],
        kline_intervals: list[str],
        on_trade: Callable[[NormalizedTrade], Awaitable[None]] | None = None,
        on_kline: Callable[[NormalizedKline], Awaitable[None]] | None = None,
    ):
        self._symbols = [s.lower() for s in symbols]
        self._intervals = kline_intervals
        self._on_trade = on_trade
        self._on_kline = on_kline
        self._ws = None
        self._running = False
        self._reconnect_delay = INITIAL_RECONNECT_DELAY
        self._task: asyncio.Task | None = None
        self._ssl_ctx = ssl.create_default_context(cafile=certifi.where())

    def _build_stream_url(self) -> str:
        streams = []
        for sym in self._symbols:
            streams.append(f"{sym}@trade")
            for interval in self._intervals:
                streams.append(f"{sym}@kline_{interval}")
        combined = "/".join(streams)
        return f"{binance_ws_url()}/stream?streams={combined}"

    def _parse_trade(self, data: dict) -> NormalizedTrade:
        return NormalizedTrade(
            symbol=data["s"],
            price=Decimal(data["p"]),
            quantity=Decimal(data["q"]),
            timestamp=data["T"],
            buyer_maker=data["m"],
        )

    def _parse_kline(self, data: dict) -> NormalizedKline:
        k = data["k"]
        return NormalizedKline(
            symbol=data["s"],
            interval=k["i"],
            open_time=k["t"],
            close_time=k["T"],
            open=Decimal(k["o"]),
            high=Decimal(k["h"]),
            low=Decimal(k["l"]),
            close=Decimal(k["c"]),
            volume=Decimal(k["v"]),
            quote_volume=Decimal(k["q"]),
            trades=k["n"],
            is_closed=k["x"],
        )

    async def _handle_message(self, raw: str) -> None:
        try:
            msg = json.loads(raw)
            stream = msg.get("stream", "")
            data = msg.get("data", {})
            if "@trade" in stream:
                trade = self._parse_trade(data)
                if self._on_trade:
                    await self._on_trade(trade)
            elif "@kline_" in stream:
                kline = self._parse_kline(data)
                if self._on_kline:
                    await self._on_kline(kline)
        except Exception:
            logger.exception("failed to process binance message")

    async def _connect_loop(self) -> None:
        url = self._build_stream_url()
        while self._running:
            try:
                logger.info(
                    "connecting to binance websocket",
                    extra={"symbols": self._symbols},
                )
                async with websockets.connect(
                    url,
                    ssl=self._ssl_ctx,
                    ping_interval=20,
                    ping_timeout=10,
                    close_timeout=5,
                ) as ws:
                    self._ws = ws
                    self._reconnect_delay = INITIAL_RECONNECT_DELAY
                    logger.info(
                        "binance websocket connected",
                        extra={"symbols": self._symbols},
                    )
                    async for message in ws:
                        if not self._running:
                            break
                        await self._handle_message(message)
            except websockets.ConnectionClosed as e:
                logger.warning(
                    "binance websocket closed",
                    extra={"code": e.code, "reason": e.reason},
                )
            except Exception:
                logger.exception("binance websocket error")
            finally:
                self._ws = None
            if self._running:
                logger.info(
                    "reconnecting to binance",
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
        self._task = asyncio.create_task(self._connect_loop())

    async def stop(self) -> None:
        self._running = False
        if self._ws:
            await self._ws.close()
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None
        logger.info("binance websocket client stopped")

    @property
    def connected(self) -> bool:
        return self._ws is not None and self._ws.open
