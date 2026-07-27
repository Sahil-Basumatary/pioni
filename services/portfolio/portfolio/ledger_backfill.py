from __future__ import annotations
import logging
import uuid
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from common import (
    LedgerEntry as LedgerEntryORM,
    OrderSide,
    Portfolio as PortfolioORM,
    Trade as TradeORM,
)
from portfolio.domain import PortfolioState, PositionState
from portfolio.ledger import LedgerLeg, legs_for_fill
from portfolio.state import apply_fill_to_portfolio

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class TradeSnapshot:
    id: uuid.UUID
    symbol: str
    side: OrderSide
    quantity: Decimal
    price: Decimal
    fee: Decimal
    executed_at: datetime


@dataclass(frozen=True, slots=True)
class PlannedLedgerWrite:
    trade_id: uuid.UUID
    executed_at: datetime
    legs: tuple[LedgerLeg, LedgerLeg]


def plan_ledger_backfill(
    *,
    portfolio_id: uuid.UUID,
    user_id: uuid.UUID,
    initial_balance: Decimal,
    trades: list[TradeSnapshot],
    existing_trade_ids: set[uuid.UUID],
) -> list[PlannedLedgerWrite]:
    cash = initial_balance
    positions: dict[str, PositionState] = {}
    planned: list[PlannedLedgerWrite] = []
    for trade in trades:
        position = positions.get(trade.symbol) or PositionState(
            portfolio_id=portfolio_id,
            symbol=trade.symbol,
            quantity=Decimal(0),
            avg_entry_price=Decimal(0),
            realized_pnl=Decimal(0),
        )
        portfolio = PortfolioState(
            id=portfolio_id,
            user_id=user_id,
            cash_balance=cash,
            initial_balance=initial_balance,
        )
        try:
            new_portfolio, new_position, _ = apply_fill_to_portfolio(
                portfolio,
                position,
                trade.side,
                trade.quantity,
                trade.price,
                trade.fee,
            )
        except ValueError:
            logger.warning(
                "ledger backfill skipped inconsistent trade",
                extra={
                    "portfolio_id": str(portfolio_id),
                    "trade_id": str(trade.id),
                    "symbol": trade.symbol,
                },
            )
            break
        cash = new_portfolio.cash_balance
        positions[trade.symbol] = new_position
        if trade.id in existing_trade_ids:
            continue
        planned.append(
            PlannedLedgerWrite(
                trade_id=trade.id,
                executed_at=trade.executed_at,
                legs=legs_for_fill(
                    side=trade.side,
                    symbol=trade.symbol,
                    quantity=trade.quantity,
                    price=trade.price,
                    fee=trade.fee,
                    cash_balance_after=new_portfolio.cash_balance,
                    asset_balance_after=new_position.quantity,
                ),
            ),
        )
    return planned


async def portfolio_needs_ledger_backfill(
    session: AsyncSession, portfolio_id: uuid.UUID,
) -> bool:
    trade_count = await session.scalar(
        select(func.count())
        .select_from(TradeORM)
        .where(TradeORM.portfolio_id == portfolio_id),
    )
    if not trade_count:
        return False
    ledger_trade_count = await session.scalar(
        select(func.count(func.distinct(LedgerEntryORM.trade_id))).where(
            LedgerEntryORM.portfolio_id == portfolio_id,
            LedgerEntryORM.trade_id.is_not(None),
        ),
    )
    return (ledger_trade_count or 0) < trade_count


async def backfill_portfolio_ledger(
    session: AsyncSession, portfolio_id: uuid.UUID,
) -> int:
    portfolio = await session.get(PortfolioORM, portfolio_id, with_for_update=True)
    if portfolio is None:
        return 0
    trades = list(
        (
            await session.execute(
                select(TradeORM)
                .where(TradeORM.portfolio_id == portfolio_id)
                .order_by(TradeORM.executed_at.asc(), TradeORM.id.asc())
            )
        ).scalars().all(),
    )
    if not trades:
        return 0
    existing_ids = {
        trade_id
        for trade_id in (
            await session.execute(
                select(LedgerEntryORM.trade_id)
                .where(
                    LedgerEntryORM.portfolio_id == portfolio_id,
                    LedgerEntryORM.trade_id.is_not(None),
                )
                .distinct()
            )
        ).scalars().all()
        if trade_id is not None
    }
    snapshots = [
        TradeSnapshot(
            id=row.id,
            symbol=row.symbol,
            side=row.side,
            quantity=row.quantity,
            price=row.price,
            fee=row.fee,
            executed_at=row.executed_at,
        )
        for row in trades
    ]
    planned = plan_ledger_backfill(
        portfolio_id=portfolio.id,
        user_id=portfolio.user_id,
        initial_balance=portfolio.initial_balance,
        trades=snapshots,
        existing_trade_ids=existing_ids,
    )
    if not planned:
        return 0
    for write in planned:
        for leg in write.legs:
            session.add(
                LedgerEntryORM(
                    portfolio_id=portfolio_id,
                    trade_id=write.trade_id,
                    entry_type=leg.entry_type,
                    wallet=leg.wallet,
                    asset=leg.asset,
                    ticker=leg.ticker,
                    amount=leg.amount,
                    fee=leg.fee,
                    balance_after=leg.balance_after,
                    executed_at=write.executed_at,
                ),
            )
    await session.flush()
    return len(planned)


async def ensure_portfolio_ledger(
    session: AsyncSession, portfolio_id: uuid.UUID,
) -> int:
    if not await portfolio_needs_ledger_backfill(session, portfolio_id):
        return 0
    return await backfill_portfolio_ledger(session, portfolio_id)
