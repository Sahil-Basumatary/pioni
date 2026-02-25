from __future__ import annotations
from decimal import Decimal
from pydantic import BaseModel


class NormalizedTrade(BaseModel):
    symbol: str
    exchange: str = "binance"
    price: Decimal
    quantity: Decimal
    timestamp: int
    buyer_maker: bool

    def display_symbol(self) -> str:
        if self.symbol.endswith("USDT"):
            return f"{self.symbol[:-4]}/USDT"
        return self.symbol


class NormalizedKline(BaseModel):
    symbol: str
    exchange: str = "binance"
    interval: str
    open_time: int
    close_time: int
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    volume: Decimal
    quote_volume: Decimal
    trades: int
    is_closed: bool


class TickerSnapshot(BaseModel):
    symbol: str
    exchange: str = "binance"
    price: Decimal
    change_24h: Decimal | None = None
    change_pct_24h: float | None = None
    high_24h: Decimal | None = None
    low_24h: Decimal | None = None
    volume_24h: Decimal | None = None
    updated_at: int
