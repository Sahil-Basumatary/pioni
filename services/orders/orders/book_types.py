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


class _FastFill:
    """Lightweight fill used inside the matching loop to avoid Pydantic overhead."""
    __slots__ = ("maker_order_id", "taker_order_id", "price", "quantity", "timestamp")

    def __init__(
        self,
        maker_order_id: uuid.UUID,
        taker_order_id: uuid.UUID,
        price: Decimal,
        quantity: Decimal,
        timestamp: datetime,
    ) -> None:
        self.maker_order_id = maker_order_id
        self.taker_order_id = taker_order_id
        self.price = price
        self.quantity = quantity
        self.timestamp = timestamp

    def to_fill(self) -> Fill:
        return Fill(
            maker_order_id=self.maker_order_id,
            taker_order_id=self.taker_order_id,
            price=self.price,
            quantity=self.quantity,
            timestamp=self.timestamp,
        )


class RejectReason(str, enum.Enum):
    NO_LIQUIDITY = "NO_LIQUIDITY"
    INVALID_PRICE = "INVALID_PRICE"
    INVALID_QUANTITY = "INVALID_QUANTITY"


class OrderResult(BaseModel):
    model_config = ConfigDict(frozen=True, arbitrary_types_allowed=True)
    order_id: uuid.UUID
    status: OrderStatus
    fills: list = Field(default_factory=list)
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
