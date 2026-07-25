from __future__ import annotations
import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from common import OrderSide
from common import LedgerEntry as LedgerEntryORM
from common import Portfolio as PortfolioORM
from common import Position as PositionORM
from common import Trade as TradeORM
from portfolio.domain import PortfolioState, PositionState
from portfolio.ledger import LedgerLeg


class PortfolioNotFoundError(LookupError):
    pass


class PortfolioRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_portfolio(
        self, portfolio_id: uuid.UUID, *, for_update: bool = False,
    ) -> PortfolioState:
        stmt = select(PortfolioORM).where(PortfolioORM.id == portfolio_id)
        if for_update:
            stmt = stmt.with_for_update()
        row = (await self._session.execute(stmt)).scalar_one_or_none()
        if row is None:
            raise PortfolioNotFoundError(f"portfolio {portfolio_id} not found")
        return _to_portfolio_state(row)

    async def get_position(
        self,
        portfolio_id: uuid.UUID,
        symbol: str,
        *,
        for_update: bool = False,
    ) -> PositionState | None:
        stmt = select(PositionORM).where(
            PositionORM.portfolio_id == portfolio_id,
            PositionORM.symbol == symbol,
        )
        if for_update:
            stmt = stmt.with_for_update()
        row = (await self._session.execute(stmt)).scalar_one_or_none()
        return _to_position_state(row) if row else None

    async def get_or_create_position(
        self,
        portfolio_id: uuid.UUID,
        symbol: str,
        *,
        for_update: bool = False,
    ) -> PositionState:
        existing = await self.get_position(
            portfolio_id, symbol, for_update=for_update,
        )
        if existing is not None:
            return existing
        # Created on first fill so portfolios do not carry a row per tradable symbol.
        new_orm = PositionORM(
            portfolio_id=portfolio_id,
            symbol=symbol,
            quantity=Decimal(0),
            avg_entry_price=Decimal(0),
            realized_pnl=Decimal(0),
        )
        self._session.add(new_orm)
        await self._session.flush()
        return _to_position_state(new_orm)

    async def save_portfolio(self, state: PortfolioState) -> None:
        row = await self._session.get(PortfolioORM, state.id)
        if row is None:
            raise PortfolioNotFoundError(f"portfolio {state.id} not found")
        row.cash_balance = state.cash_balance

    async def save_position(self, state: PositionState) -> None:
        row = (await self._session.execute(
            select(PositionORM).where(
                PositionORM.portfolio_id == state.portfolio_id,
                PositionORM.symbol == state.symbol,
            )
        )).scalar_one()
        row.quantity = state.quantity
        row.avg_entry_price = state.avg_entry_price
        row.realized_pnl = state.realized_pnl

    async def insert_trade(
        self,
        *,
        trade_id: uuid.UUID,
        order_id: uuid.UUID,
        portfolio_id: uuid.UUID,
        symbol: str,
        side: OrderSide,
        quantity: Decimal,
        price: Decimal,
        fee: Decimal,
        executed_at: datetime,
    ) -> None:
        self._session.add(TradeORM(
            id=trade_id,
            order_id=order_id,
            portfolio_id=portfolio_id,
            symbol=symbol,
            side=side,
            quantity=quantity,
            price=price,
            fee=fee,
            executed_at=executed_at,
        ))

    async def insert_ledger_legs(
        self,
        *,
        portfolio_id: uuid.UUID,
        trade_id: uuid.UUID | None,
        executed_at: datetime,
        legs: tuple[LedgerLeg, ...] | list[LedgerLeg],
    ) -> None:
        for leg in legs:
            self._session.add(LedgerEntryORM(
                portfolio_id=portfolio_id,
                trade_id=trade_id,
                entry_type=leg.entry_type,
                wallet=leg.wallet,
                asset=leg.asset,
                ticker=leg.ticker,
                amount=leg.amount,
                fee=leg.fee,
                balance_after=leg.balance_after,
                executed_at=executed_at,
            ))


def _to_portfolio_state(row: PortfolioORM) -> PortfolioState:
    return PortfolioState(
        id=row.id,
        user_id=row.user_id,
        cash_balance=row.cash_balance,
        initial_balance=row.initial_balance,
    )


def _to_position_state(row: PositionORM) -> PositionState:
    return PositionState(
        portfolio_id=row.portfolio_id,
        symbol=row.symbol,
        quantity=row.quantity,
        avg_entry_price=row.avg_entry_price,
        realized_pnl=row.realized_pnl,
    )
