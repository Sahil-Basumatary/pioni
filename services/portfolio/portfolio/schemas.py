from __future__ import annotations
import uuid
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from common import OrderSide, PriceAlertCondition, PriceAlertStatus


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


class LedgerEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    portfolio_id: uuid.UUID
    trade_id: uuid.UUID | None
    entry_type: str
    wallet: str
    asset: str
    ticker: str
    amount: Decimal
    fee: Decimal
    balance_after: Decimal
    executed_at: datetime


class PortfolioSummaryResponse(BaseModel):
    model_config = ConfigDict(frozen=True)
    portfolio: PortfolioResponse
    positions: list[PositionResponse]
    total_value: Decimal
    total_realized_pnl: Decimal
    total_unrealized_pnl: Decimal | None = None


class DailyPnlPointResponse(BaseModel):
    model_config = ConfigDict(frozen=True)
    date: date
    total_value: Decimal
    daily_pnl: Decimal
    cumulative_pnl: Decimal


class OnboardingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID
    welcome_seen: bool
    tour_completed: bool
    tour_skipped: bool
    checklist_tour: bool
    checklist_first_trade: bool
    checklist_view_position: bool
    checklist_sentiment: bool
    checklist_limit_order: bool
    tour_completed_at: datetime | None = None
    tour_skipped_at: datetime | None = None
    checklist_completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class OnboardingPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")
    welcome_seen: bool | None = None
    tour_completed: bool | None = None
    tour_skipped: bool | None = None
    checklist_tour: bool | None = None
    checklist_first_trade: bool | None = None
    checklist_view_position: bool | None = None
    checklist_sentiment: bool | None = None
    checklist_limit_order: bool | None = None


class ApiKeyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    key_prefix: str
    can_query: bool
    can_trade: bool
    created_at: datetime
    last_used_at: datetime | None = None


class ApiKeyCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str
    can_query: bool = True
    can_trade: bool = True


class ApiKeyCreatedResponse(ApiKeyResponse):
    api_key: str


class NotificationPrefsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    mode: str
    toast_popups: bool
    email_enabled: bool
    browser_notifications: bool
    fills: bool
    partial_fills: bool
    cancellations: bool
    rejections: bool
    placements: bool


class NotificationPrefsPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")
    mode: str | None = None
    toast_popups: bool | None = None
    email_enabled: bool | None = None
    browser_notifications: bool | None = None
    fills: bool | None = None
    partial_fills: bool | None = None
    cancellations: bool | None = None
    rejections: bool | None = None
    placements: bool | None = None


class FavoritesResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    symbols: list[str]


class FavoritesPut(BaseModel):
    model_config = ConfigDict(extra="forbid")
    symbols: list[str]


class OrderEmailNotifyRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    portfolio_id: uuid.UUID
    symbol: str
    status: str
    side: str | None = None


class PriceAlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    symbol: str
    condition: PriceAlertCondition
    target_price: Decimal
    status: PriceAlertStatus
    triggered_at: datetime | None = None
    cancelled_at: datetime | None = None
    trigger_price: Decimal | None = None
    created_at: datetime
    updated_at: datetime


class PriceAlertCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    symbol: str
    condition: str
    target_price: Decimal


class PriceAlertTrigger(BaseModel):
    model_config = ConfigDict(extra="forbid")
    price: Decimal
