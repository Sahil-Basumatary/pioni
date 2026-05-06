from __future__ import annotations
import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from common import OrderSide


class PortfolioResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    initial_balance: Decimal
    cash_balance: Decimal
    is_active: bool
    created_at: datetime
    updated_at: datetime


class PositionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    portfolio_id: uuid.UUID
    symbol: str
    quantity: Decimal
    avg_entry_price: Decimal
    realized_pnl: Decimal
    market_price: Decimal | None = None
    unrealized_pnl: Decimal | None = None
    created_at: datetime
    updated_at: datetime


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


class PortfolioSummaryResponse(BaseModel):
    model_config = ConfigDict(frozen=True)
    portfolio: PortfolioResponse
    positions: list[PositionResponse]
    total_value: Decimal
    total_realized_pnl: Decimal
    total_unrealized_pnl: Decimal | None = None
