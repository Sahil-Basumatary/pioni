from __future__ import annotations
import uuid
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from common import (
    get_db,
    Portfolio as PortfolioORM,
    Position as PositionORM,
    Trade as TradeORM,
)
from portfolio.repository import PortfolioRepository
from portfolio.schemas import (
    PortfolioResponse,
    PortfolioSummaryResponse,
    PositionResponse,
    TradeResponse,
)

router = APIRouter(tags=["portfolios"])


def get_repository(
    session: AsyncSession = Depends(get_db),
) -> PortfolioRepository:
    return PortfolioRepository(session)


def _not_found(portfolio_id: uuid.UUID) -> HTTPException:
    return HTTPException(
        status_code=404,
        detail={
            "error": "portfolio_not_found",
            "message": f"portfolio {portfolio_id} not found",
        },
    )


@router.get("/portfolios/{portfolio_id}", response_model=PortfolioResponse)
async def get_portfolio(
    portfolio_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
) -> PortfolioResponse:
    row = await session.get(PortfolioORM, portfolio_id)
    if row is None:
        raise _not_found(portfolio_id)
    return PortfolioResponse.model_validate(row)


@router.get(
    "/portfolios/{portfolio_id}/positions",
    response_model=list[PositionResponse],
)
async def list_positions(
    portfolio_id: uuid.UUID,
    open_only: bool = Query(False),
    session: AsyncSession = Depends(get_db),
) -> list[PositionResponse]:
    stmt = select(PositionORM).where(PositionORM.portfolio_id == portfolio_id)
    if open_only:
        stmt = stmt.where(PositionORM.quantity > 0)
    stmt = stmt.order_by(PositionORM.symbol)
    rows = (await session.execute(stmt)).scalars().all()
    return [PositionResponse.model_validate(r) for r in rows]


@router.get(
    "/portfolios/{portfolio_id}/trades",
    response_model=list[TradeResponse],
)
async def list_trades(
    portfolio_id: uuid.UUID,
    symbol: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_db),
) -> list[TradeResponse]:
    stmt = select(TradeORM).where(TradeORM.portfolio_id == portfolio_id)
    if symbol:
        stmt = stmt.where(TradeORM.symbol == symbol.upper())
    stmt = stmt.order_by(TradeORM.executed_at.desc()).limit(limit).offset(offset)
    rows = (await session.execute(stmt)).scalars().all()
    return [TradeResponse.model_validate(r) for r in rows]


@router.get(
    "/portfolios/{portfolio_id}/summary",
    response_model=PortfolioSummaryResponse,
)
async def get_summary(
    portfolio_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
) -> PortfolioSummaryResponse:
    portfolio = await session.get(PortfolioORM, portfolio_id)
    if portfolio is None:
        raise _not_found(portfolio_id)
    positions_stmt = (
        select(PositionORM)
        .where(PositionORM.portfolio_id == portfolio_id)
        .order_by(PositionORM.symbol)
    )
    positions = (await session.execute(positions_stmt)).scalars().all()
    # Cost-basis valuation: cash plus capital tied up in positions valued at entry price.
    # Market-price valuation and unrealized P&L land once the price-cache integration is in.
    invested = sum(
        (p.quantity * p.avg_entry_price for p in positions), start=Decimal(0),
    )
    total_realized = sum(
        (p.realized_pnl for p in positions), start=Decimal(0),
    )
    return PortfolioSummaryResponse(
        portfolio=PortfolioResponse.model_validate(portfolio),
        positions=[PositionResponse.model_validate(p) for p in positions],
        total_value=portfolio.cash_balance + invested,
        total_realized_pnl=total_realized,
        total_unrealized_pnl=None,
    )
