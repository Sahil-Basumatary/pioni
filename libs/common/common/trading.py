from __future__ import annotations
import uuid
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from common.database.models import OrderSide, OrderType, Position


def estimate_required_cash(
    *,
    side: OrderSide,
    order_type: OrderType,
    quantity: Decimal,
    price: Decimal | None = None,
    stop_price: Decimal | None = None,
    best_ask: Decimal | None = None,
) -> Decimal | None:
    # Returns None when no meaningful estimate is possible (SELL, or MARKET with empty book).
    # The caller treats None as "skip the check"; downstream rejection happens at fill time.
    if side != OrderSide.BUY:
        return None
    if order_type == OrderType.LIMIT:
        return quantity * (price or Decimal("0"))
    if order_type == OrderType.STOP_LOSS:
        return quantity * (stop_price or Decimal("0"))
    if order_type == OrderType.MARKET and best_ask is not None:
        return quantity * best_ask
    return None


async def held_quantity(
    session: AsyncSession,
    portfolio_id: uuid.UUID,
    symbol: str,
    *,
    for_update: bool = False,
) -> Decimal:
    stmt = select(Position).where(
        Position.portfolio_id == portfolio_id,
        Position.symbol == symbol,
    )
    if for_update:
        stmt = stmt.with_for_update()
    row = (await session.execute(stmt)).scalar_one_or_none()
    return row.quantity if row else Decimal("0")
