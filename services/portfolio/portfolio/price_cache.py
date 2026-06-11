from __future__ import annotations
import logging
import time
from decimal import Decimal, InvalidOperation
from typing import Any

logger = logging.getLogger(__name__)

DEFAULT_STALE_AFTER_SECONDS = 60.0


class PriceCache:
    # In-memory only by design. After a restart we miss prices for the few seconds it takes
    # for the next ticks to arrive — acceptable. Persisting through Redis here would just add
    # a hop and stale data; the live pub/sub stream is the source of truth.
    def __init__(self, stale_after_seconds: float = DEFAULT_STALE_AFTER_SECONDS):
        self._prices: dict[str, tuple[Decimal, float]] = {}
        self._stale_after = stale_after_seconds

    def update(self, symbol: str, price: Decimal) -> None:
        self._prices[symbol.upper()] = (price, time.monotonic())

    def get(self, symbol: str) -> Decimal | None:
        entry = self._prices.get(symbol.upper())
        if entry is None:
            return None
        price, ts = entry
        if time.monotonic() - ts > self._stale_after:
            return None
        return price

    def snapshot(self) -> dict[str, Decimal]:
        now = time.monotonic()
        return {
            sym: price
            for sym, (price, ts) in self._prices.items()
            if now - ts <= self._stale_after
        }

    async def on_trade(self, symbol: str, data: dict[str, Any]) -> None:
        # Adapter for common.MarketSubscriber — trade payloads are JSON-decoded dicts where
        # price was serialized via str(Decimal). Parse defensively; a single malformed event
        # must never poison the cache or kill the subscriber loop.
        raw = data.get("price")
        if raw is None:
            return
        try:
            self.update(symbol, Decimal(str(raw)))
        except (InvalidOperation, ValueError):
            logger.warning(
                "invalid price in trade event",
                extra={"symbol": symbol, "price": raw},
            )
