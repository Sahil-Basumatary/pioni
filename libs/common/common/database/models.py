from __future__ import annotations
import enum
import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Numeric,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from common.database.base import Base, UUIDMixin, TimestampMixin


class OrderSide(str, enum.Enum):
    BUY = "BUY"
    SELL = "SELL"


class OrderType(str, enum.Enum):
    MARKET = "MARKET"
    LIMIT = "LIMIT"
    STOP_LOSS = "STOP_LOSS"


class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    OPEN = "OPEN"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"
    FILLED = "FILLED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"


class TimeInForce(str, enum.Enum):
    GTC = "GTC"
    IOC = "IOC"


class User(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "users"
    clerk_id: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False,
    )
    email: Mapped[str] = mapped_column(
        String(320), unique=True, nullable=False, index=True,
    )
    username: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    portfolios: Mapped[list[Portfolio]] = relationship(back_populates="user")
    onboarding: Mapped[UserOnboarding | None] = relationship(
        back_populates="user", uselist=False,
    )
    api_keys: Mapped[list[PaperApiKey]] = relationship(back_populates="user")
    notification_prefs: Mapped[UserNotificationPrefs | None] = relationship(
        back_populates="user", uselist=False,
    )

class UserOnboarding(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "user_onboarding"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_user_onboarding_user_id"),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    welcome_seen: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    tour_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    tour_skipped: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    checklist_tour: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    checklist_first_trade: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False,
    )
    checklist_view_position: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False,
    )
    checklist_sentiment: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False,
    )
    checklist_limit_order: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False,
    )
    tour_completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    tour_skipped_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    checklist_completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    user: Mapped[User] = relationship(back_populates="onboarding")


class PaperApiKey(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "paper_api_keys"
    __table_args__ = (
        UniqueConstraint("key_hash", name="uq_paper_api_keys_key_hash"),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    key_prefix: Mapped[str] = mapped_column(String(24), nullable=False)
    key_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    can_query: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    can_trade: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    last_used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    user: Mapped[User] = relationship(back_populates="api_keys")


class UserNotificationPrefs(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "user_notification_prefs"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_user_notification_prefs_user_id"),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    mode: Mapped[str] = mapped_column(String(20), default="all", nullable=False)
    toast_popups: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    email_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    browser_notifications: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False,
    )
    fills: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    partial_fills: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    cancellations: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    rejections: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    placements: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    user: Mapped[User] = relationship(back_populates="notification_prefs")


class Portfolio(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "portfolios"
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    initial_balance: Mapped[Decimal] = mapped_column(Numeric(20, 2), nullable=False)
    cash_balance: Mapped[Decimal] = mapped_column(Numeric(20, 2), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    user: Mapped[User] = relationship(back_populates="portfolios")
    orders: Mapped[list[Order]] = relationship(back_populates="portfolio")
    trades: Mapped[list[Trade]] = relationship(back_populates="portfolio")
    positions: Mapped[list[Position]] = relationship(back_populates="portfolio")


class Order(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "orders"
    portfolio_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("portfolios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    symbol: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    side: Mapped[OrderSide] = mapped_column(
        Enum(OrderSide, name="order_side"), nullable=False,
    )
    order_type: Mapped[OrderType] = mapped_column(
        Enum(OrderType, name="order_type"), nullable=False,
    )
    time_in_force: Mapped[TimeInForce] = mapped_column(
        Enum(TimeInForce, name="time_in_force"),
        nullable=False,
        default=TimeInForce.GTC,
    )
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, name="order_status"),
        nullable=False,
        default=OrderStatus.PENDING,
        index=True,
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(20, 8), nullable=False)
    price: Mapped[Decimal | None] = mapped_column(Numeric(20, 2), nullable=True)
    stop_price: Mapped[Decimal | None] = mapped_column(Numeric(20, 2), nullable=True)
    filled_quantity: Mapped[Decimal] = mapped_column(
        Numeric(20, 8), nullable=False, default=0,
    )
    average_fill_price: Mapped[Decimal | None] = mapped_column(
        Numeric(20, 2), nullable=True,
    )
    portfolio: Mapped[Portfolio] = relationship(back_populates="orders")
    trades: Mapped[list[Trade]] = relationship(back_populates="order")


class Trade(UUIDMixin, Base):
    __tablename__ = "trades"
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    portfolio_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("portfolios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    symbol: Mapped[str] = mapped_column(String(20), nullable=False)
    # Reuses the order_side PG enum already created by Order
    side: Mapped[OrderSide] = mapped_column(
        Enum(OrderSide, name="order_side", create_type=False), nullable=False,
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(20, 8), nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(20, 2), nullable=False)
    fee: Mapped[Decimal] = mapped_column(Numeric(20, 2), nullable=False, default=0)
    executed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
    order: Mapped[Order] = relationship(back_populates="trades")
    portfolio: Mapped[Portfolio] = relationship(back_populates="trades")


class Position(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "positions"
    __table_args__ = (
        UniqueConstraint("portfolio_id", "symbol", name="uq_positions_portfolio_symbol"),
    )
    portfolio_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("portfolios.id", ondelete="CASCADE"),
        nullable=False,
    )
    symbol: Mapped[str] = mapped_column(String(20), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(20, 8), nullable=False, default=0)
    avg_entry_price: Mapped[Decimal] = mapped_column(
        Numeric(20, 2), nullable=False, default=0,
    )
    realized_pnl: Mapped[Decimal] = mapped_column(
        Numeric(20, 2), nullable=False, default=0,
    )
    portfolio: Mapped[Portfolio] = relationship(back_populates="positions")


class PortfolioSnapshot(UUIDMixin, Base):
    # Append-only time series. Risk metrics (Sharpe, drawdown, VaR) read this directly.
    # No relationship back to Portfolio: keeps queries explicit by portfolio_id and avoids
    # accidentally lazy-loading thousands of snapshots when iterating Portfolio.snapshots.
    # If write volume ever forces it, the (portfolio_id, snapshot_at) composite index makes
    # this table a clean candidate for TimescaleDB hypertable conversion later.
    __tablename__ = "portfolio_snapshots"
    __table_args__ = (
        Index(
            "ix_portfolio_snapshots_portfolio_at",
            "portfolio_id",
            "snapshot_at",
        ),
    )
    portfolio_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("portfolios.id", ondelete="CASCADE"),
        nullable=False,
    )
    snapshot_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    total_value: Mapped[Decimal] = mapped_column(Numeric(20, 2), nullable=False)
    cash_balance: Mapped[Decimal] = mapped_column(Numeric(20, 2), nullable=False)
    positions_value: Mapped[Decimal] = mapped_column(Numeric(20, 2), nullable=False)
    total_realized_pnl: Mapped[Decimal] = mapped_column(
        Numeric(20, 2), nullable=False,
    )
    total_unrealized_pnl: Mapped[Decimal | None] = mapped_column(
        Numeric(20, 2), nullable=True,
    )
