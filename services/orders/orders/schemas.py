from __future__ import annotations
import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from common import (
    MAX_NOTIONAL,
    MAX_NUMERIC_20_8,
    OrderSide,
    OrderType,
    OrderStatus,
    TimeInForce,
    fits_notional,
    fits_numeric_20_2,
    fits_numeric_20_8,
)


class SubmitOrderRequest(BaseModel):
    portfolio_id: uuid.UUID
    symbol: str
    side: OrderSide
    order_type: OrderType = OrderType.LIMIT
    time_in_force: TimeInForce = TimeInForce.GTC
    quantity: Decimal = Field(gt=0, le=MAX_NUMERIC_20_8)
    price: Decimal | None = None
    stop_price: Decimal | None = None

    @field_validator("symbol")
    @classmethod
    def normalize_symbol(cls, v: str) -> str:
        return v.strip().upper()

    @field_validator("price", "stop_price")
    @classmethod
    def validate_price_bounds(cls, v: Decimal | None) -> Decimal | None:
        if v is None:
            return v
        if v <= 0:
            raise ValueError("must be positive")
        if not fits_numeric_20_2(v):
            raise ValueError("exceeds maximum allowed price")
        return v

    @model_validator(mode="after")
    def validate_price_fields(self) -> SubmitOrderRequest:
        if self.order_type == OrderType.LIMIT:
            if self.price is None or self.price <= 0:
                raise ValueError("price must be positive for limit orders")
            if not fits_notional(self.quantity, self.price):
                raise ValueError(
                    f"order notional exceeds maximum of {MAX_NOTIONAL}",
                )
        if self.order_type == OrderType.STOP_LOSS:
            if self.stop_price is None or self.stop_price <= 0:
                raise ValueError("stop_price must be positive for stop-loss orders")
            if not fits_notional(self.quantity, self.stop_price):
                raise ValueError(
                    f"order notional exceeds maximum of {MAX_NOTIONAL}",
                )
        if not fits_numeric_20_8(self.quantity):
            raise ValueError("quantity exceeds maximum allowed size")
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
