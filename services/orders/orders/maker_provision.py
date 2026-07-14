from __future__ import annotations
import logging
import uuid
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from common import User, Portfolio, Position
import orders.settings as settings

logger = logging.getLogger(__name__)


async def ensure_maker_portfolio(session: AsyncSession) -> uuid.UUID:
    stmt = select(User).where(User.clerk_id == settings.MAKER_CLERK_ID)
    user = (await session.execute(stmt)).scalar_one_or_none()
    if user is None:
        user = User(
            clerk_id=settings.MAKER_CLERK_ID,
            email=settings.MAKER_EMAIL,
            username=settings.MAKER_USERNAME,
            is_active=True,
        )
        session.add(user)
        try:
            await session.flush()
        except IntegrityError:
            await session.rollback()
            user = (await session.execute(stmt)).scalar_one_or_none()
            if user is None:
                raise
    p_stmt = (
        select(Portfolio)
        .where(Portfolio.user_id == user.id)
        .order_by(Portfolio.created_at)
        .limit(1)
    )
    portfolio = (await session.execute(p_stmt)).scalar_one_or_none()
    if portfolio is None:
        portfolio = Portfolio(
            user_id=user.id,
            name="Synthetic Maker",
            initial_balance=settings.MAKER_CASH,
            cash_balance=settings.MAKER_CASH,
            is_active=True,
        )
        session.add(portfolio)
        await session.flush()
    else:
        # Keep the desk solvent across restarts so sell-side and buy-side liquidity
        # never fail availability checks after a busy fill day.
        portfolio.cash_balance = settings.MAKER_CASH
        portfolio.is_active = True
        await session.flush()
    for symbol in settings.trading_symbols():
        await _ensure_position(session, portfolio.id, symbol)
    await session.commit()
    logger.info(
        "maker portfolio ready",
        extra={"portfolio_id": str(portfolio.id)},
    )
    return portfolio.id


async def _ensure_position(
    session: AsyncSession,
    portfolio_id: uuid.UUID,
    symbol: str,
) -> None:
    stmt = select(Position).where(
        Position.portfolio_id == portfolio_id,
        Position.symbol == symbol,
    )
    row = (await session.execute(stmt)).scalar_one_or_none()
    if row is None:
        session.add(
            Position(
                portfolio_id=portfolio_id,
                symbol=symbol,
                quantity=settings.MAKER_POSITION_QTY,
                avg_entry_price=Decimal("1"),
                realized_pnl=Decimal("0"),
            )
        )
        await session.flush()
        return
    if row.quantity < settings.MAKER_POSITION_QTY / 2:
        row.quantity = settings.MAKER_POSITION_QTY
        await session.flush()
