from __future__ import annotations
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field
from common import OrderSide, OrderType, TimeInForce
from orders.book_types import RejectReason


class BaseEvent(BaseModel):
    model_config = ConfigDict(frozen=True)
    event_id: uuid.UUID = Field(default_factory=uuid.uuid4)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @property
    def event_type(self) -> str:
        raise NotImplementedError

    @property
    def routing_key(self) -> str:
        raise NotImplementedError


class OrderAccepted(BaseEvent):
    order_id: uuid.UUID
    portfolio_id: uuid.UUID
    symbol: str
    side: OrderSide
    order_type: OrderType
    time_in_force: TimeInForce
    quantity: Decimal
    price: Decimal | None = None
    stop_price: Decimal | None = None

    @property
    def event_type(self) -> str:
        return "order.accepted"

    @property
    def routing_key(self) -> str:
        return f"order.accepted.{self.symbol}"


class OrderFilled(BaseEvent):
    order_id: uuid.UUID
    portfolio_id: uuid.UUID
    symbol: str
    side: OrderSide
    filled_quantity: Decimal
    average_fill_price: Decimal

    @property
    def event_type(self) -> str:
        return "order.filled"

    @property
    def routing_key(self) -> str:
        return f"order.filled.{self.symbol}"


class OrderCancelled(BaseEvent):
    order_id: uuid.UUID
    portfolio_id: uuid.UUID
    symbol: str
    remaining_quantity: Decimal

    @property
    def event_type(self) -> str:
        return "order.cancelled"

    @property
    def routing_key(self) -> str:
        return f"order.cancelled.{self.symbol}"


class OrderRejected(BaseEvent):
    order_id: uuid.UUID
    portfolio_id: uuid.UUID
    symbol: str
    side: OrderSide
    order_type: OrderType
    reason: RejectReason

    @property
    def event_type(self) -> str:
        return "order.rejected"

    @property
    def routing_key(self) -> str:
        return f"order.rejected.{self.symbol}"


class TradeExecuted(BaseEvent):
    trade_id: uuid.UUID = Field(default_factory=uuid.uuid4)
    order_id: uuid.UUID
    portfolio_id: uuid.UUID
    symbol: str
    side: OrderSide
    quantity: Decimal
    price: Decimal
    fee: Decimal = Decimal("0")
    maker_order_id: uuid.UUID
    taker_order_id: uuid.UUID

    @property
    def event_type(self) -> str:
        return "trade.executed"

    @property
    def routing_key(self) -> str:
        return f"trade.executed.{self.symbol}"
