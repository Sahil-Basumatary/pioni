from __future__ import annotations
import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field
from common import OrderSide, TimeInForce


class BookOrder(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    order_id: uuid.UUID
    symbol: str
    side: OrderSide
    price: Decimal
    quantity: Decimal
    remaining: Decimal
    timestamp: datetime
    time_in_force: TimeInForce = TimeInForce.GTC

    @property
    def is_filled(self) -> bool:
        return self.remaining <= 0


class PriceLevelView(BaseModel):
    model_config = ConfigDict(frozen=True)
    price: Decimal
    total_quantity: Decimal
    order_count: int = Field(ge=0)


class BookSnapshot(BaseModel):
    model_config = ConfigDict(frozen=True)
    symbol: str
    bids: list[PriceLevelView]
    asks: list[PriceLevelView]
    best_bid: Decimal | None
    best_ask: Decimal | None
    spread: Decimal | None
    timestamp: datetime
