from __future__ import annotations
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from common import get_db
from portfolio.repository import PortfolioRepository

router = APIRouter(tags=["portfolios"])


def get_repository(
    session: AsyncSession = Depends(get_db),
) -> PortfolioRepository:
    return PortfolioRepository(session)
