from __future__ import annotations
import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from common import OrderSide, OrderType, OrderStatus, TimeInForce


class SubmitOrderRequest(BaseModel):
    portfolio_id: uuid.UUID
    symbol: str
    side: OrderSide
    order_type: OrderType = OrderType.LIMIT
    time_in_force: TimeInForce = TimeInForce.GTC
    quantity: Decimal = Field(gt=0)
    price: Decimal | None = None
    stop_price: Decimal | None = None

    @field_validator("symbol")
    @classmethod
    def normalize_symbol(cls, v: str) -> str:
        return v.strip().upper()

    @model_validator(mode="after")
    def validate_price_fields(self) -> SubmitOrderRequest:
        if self.order_type == OrderType.LIMIT:
            if self.price is None or self.price <= 0:
                raise ValueError("price must be positive for limit orders")
        if self.order_type == OrderType.STOP_LOSS:
            if self.stop_price is None or self.stop_price <= 0:
                raise ValueError("stop_price must be positive for stop-loss orders")
        return self


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    portfolio_id: uuid.UUID
    symbol: str
    side: OrderSide
    order_type: OrderType
    time_in_force: TimeInForce
    status: OrderStatus
    quantity: Decimal
    price: Decimal | None
    stop_price: Decimal | None
    filled_quantity: Decimal
    average_fill_price: Decimal | None
    created_at: datetime
    updated_at: datetime


class CancelOrderResponse(BaseModel):
    model_config = ConfigDict(frozen=True)
    order_id: uuid.UUID
    status: OrderStatus
    remaining_quantity: Decimal


class TradeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    order_id: uuid.UUID
    portfolio_id: uuid.UUID
    symbol: str
    side: OrderSide
    quantity: Decimal
    price: Decimal
    fee: Decimal
    executed_at: datetime
