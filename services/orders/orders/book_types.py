from __future__ import annotations
import enum
import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field
from common import OrderSide, OrderType, OrderStatus, TimeInForce


class BookOrder(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    order_id: uuid.UUID
    symbol: str
    side: OrderSide
    order_type: OrderType = OrderType.LIMIT
    price: Decimal
    quantity: Decimal
    remaining: Decimal
    timestamp: datetime
    time_in_force: TimeInForce = TimeInForce.GTC
    stop_price: Decimal | None = None

    @property
    def is_filled(self) -> bool:
        return self.remaining <= 0


class Fill(BaseModel):
    model_config = ConfigDict(frozen=True)
    maker_order_id: uuid.UUID
    taker_order_id: uuid.UUID
    price: Decimal
    quantity: Decimal
    timestamp: datetime


class RejectReason(str, enum.Enum):
    NO_LIQUIDITY = "NO_LIQUIDITY"
    INVALID_PRICE = "INVALID_PRICE"
    INVALID_QUANTITY = "INVALID_QUANTITY"


class OrderResult(BaseModel):
    model_config = ConfigDict(frozen=True)
    order_id: uuid.UUID
    status: OrderStatus
    fills: list[Fill] = Field(default_factory=list)
    remaining_quantity: Decimal
    reject_reason: RejectReason | None = None


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
