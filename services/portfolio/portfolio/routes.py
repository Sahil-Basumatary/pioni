from __future__ import annotations
import uuid
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from common import (
    get_db,
    Portfolio as PortfolioORM,
    Position as PositionORM,
    Trade as TradeORM,
)
from portfolio.price_cache import PriceCache
from portfolio.repository import PortfolioRepository
from portfolio.schemas import (
    PortfolioResponse,
    PortfolioSummaryResponse,
    PositionResponse,
    TradeResponse,
)
from portfolio.valuation import (
    PositionValuation,
    total_unrealized_pnl,
    value_position,
)

router = APIRouter(tags=["portfolios"])


def get_repository(
    session: AsyncSession = Depends(get_db),
) -> PortfolioRepository:
    return PortfolioRepository(session)


def get_price_cache(request: Request) -> PriceCache:
    # Lifespan attaches a cache; tests that hit the router without lifespan get a fresh
    # empty one which makes /summary degrade gracefully to cost-basis valuations.
    cache = getattr(request.app.state, "price_cache", None)
    return cache if cache is not None else PriceCache()


def _not_found(portfolio_id: uuid.UUID) -> HTTPException:
    return HTTPException(
        status_code=404,
        detail={
            "error": "portfolio_not_found",
            "message": f"portfolio {portfolio_id} not found",
        },
    )


def _position_with_valuation(
    row: PositionORM, valuation: PositionValuation,
) -> PositionResponse:
    base = PositionResponse.model_validate(row)
    return base.model_copy(
        update={
            "market_price": valuation.market_price,
            "unrealized_pnl": valuation.unrealized_pnl,
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
    price_cache: PriceCache = Depends(get_price_cache),
) -> list[PositionResponse]:
    stmt = select(PositionORM).where(PositionORM.portfolio_id == portfolio_id)
    if open_only:
        stmt = stmt.where(PositionORM.quantity > 0)
    stmt = stmt.order_by(PositionORM.symbol)
    rows = (await session.execute(stmt)).scalars().all()
    return [
        _position_with_valuation(
            row,
            value_position(
                quantity=row.quantity,
                avg_entry_price=row.avg_entry_price,
                market_price=price_cache.get(row.symbol),
            ),
        )
        for row in rows
    ]


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
    price_cache: PriceCache = Depends(get_price_cache),
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
    valuations = [
        value_position(
            quantity=p.quantity,
            avg_entry_price=p.avg_entry_price,
            market_price=price_cache.get(p.symbol),
        )
        for p in positions
    ]
    invested = sum(
        (v.market_value for v in valuations), start=Decimal(0),
    )
    total_realized = sum(
        (p.realized_pnl for p in positions), start=Decimal(0),
    )
    return PortfolioSummaryResponse(
        portfolio=PortfolioResponse.model_validate(portfolio),
        positions=[
            _position_with_valuation(p, v) for p, v in zip(positions, valuations)
        ],
        total_value=portfolio.cash_balance + invested,
        total_realized_pnl=total_realized,
        total_unrealized_pnl=total_unrealized_pnl(valuations),
    )
