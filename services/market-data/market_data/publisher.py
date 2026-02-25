import json
import logging
import time
from collections import defaultdict
from decimal import Decimal
import redis.asyncio as aioredis
from market_data.schemas import NormalizedTrade, NormalizedKline, TickerSnapshot

logger = logging.getLogger(__name__)

CHANNEL_TRADE = "market:trade:{symbol}"
CHANNEL_KLINE = "market:kline:{symbol}:{interval}"
MAX_BUFFERED_KLINES = 500


class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return str(o)
        return super().default(o)


class MarketPublisher:
    def __init__(self):
        self._redis: aioredis.Redis | None = None
        self._snapshots: dict[str, TickerSnapshot] = {}
        self._kline_buffer: dict[str, list[dict]] = defaultdict(list)

    def set_redis(self, redis_instance: aioredis.Redis | None) -> None:
        self._redis = redis_instance

    async def handle_trade(self, trade: NormalizedTrade) -> None:
        now_ms = int(time.time() * 1000)
        existing = self._snapshots.get(trade.symbol)
        self._snapshots[trade.symbol] = TickerSnapshot(
            symbol=trade.symbol,
            price=trade.price,
            change_24h=existing.change_24h if existing else None,
            change_pct_24h=existing.change_pct_24h if existing else None,
            high_24h=existing.high_24h if existing else None,
            low_24h=existing.low_24h if existing else None,
            volume_24h=existing.volume_24h if existing else None,
            updated_at=now_ms,
        )
        if self._redis:
            channel = CHANNEL_TRADE.format(symbol=trade.symbol)
            payload = json.dumps(trade.model_dump(), cls=DecimalEncoder)
            try:
                await self._redis.publish(channel, payload)
            except Exception:
                logger.warning(
                    "failed to publish trade to redis",
                    extra={"symbol": trade.symbol},
                )

    async def handle_kline(self, kline: NormalizedKline) -> None:
        key = f"{kline.symbol}:{kline.interval}"
        buf = self._kline_buffer[key]
        kline_dict = kline.model_dump()
        if buf and buf[-1]["open_time"] == kline.open_time:
            buf[-1] = kline_dict
        else:
            buf.append(kline_dict)
            if len(buf) > MAX_BUFFERED_KLINES:
                self._kline_buffer[key] = buf[-MAX_BUFFERED_KLINES:]
        if self._redis:
            channel = CHANNEL_KLINE.format(
                symbol=kline.symbol, interval=kline.interval
            )
            payload = json.dumps(kline_dict, cls=DecimalEncoder)
            try:
                await self._redis.publish(channel, payload)
            except Exception:
                logger.warning(
                    "failed to publish kline to redis",
                    extra={"symbol": kline.symbol},
                )

    def get_snapshot(self, symbol: str) -> TickerSnapshot | None:
        return self._snapshots.get(symbol.upper())

    def get_all_snapshots(self) -> dict[str, TickerSnapshot]:
        return dict(self._snapshots)

    def get_klines(
        self, symbol: str, interval: str, limit: int = 100
    ) -> list[dict]:
        key = f"{symbol.upper()}:{interval}"
        buf = self._kline_buffer.get(key, [])
        return buf[-limit:]
