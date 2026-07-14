from __future__ import annotations
import uuid
from datetime import datetime, timezone
from decimal import Decimal
import pytest
from fastapi import HTTPException
from common import Portfolio as PortfolioORM
from portfolio.routes import reset_portfolio


class _FakeSession:
    def __init__(self, portfolio):
        self._portfolio = portfolio
        self.executed: list = []
        self.flushed = False
        self.refreshed: list = []

    async def get(self, model, pk, with_for_update=False):
        return self._portfolio

    async def execute(self, stmt):
        self.executed.append(stmt)

    async def flush(self):
        self.flushed = True

    async def refresh(self, obj):
        self.refreshed.append(obj)


def _portfolio(cash: str, initial: str) -> PortfolioORM:
    portfolio = PortfolioORM(
        user_id=uuid.uuid4(),
        name="Main",
        initial_balance=Decimal(initial),
        cash_balance=Decimal(cash),
    )
    portfolio.id = uuid.uuid4()
    portfolio.is_active = True
    now = datetime.now(timezone.utc)
    portfolio.created_at = now
    portfolio.updated_at = now
    return portfolio


async def test_reset_restores_balance_and_clears_state():
    portfolio = _portfolio(cash="250", initial="100000")
    session = _FakeSession(portfolio)
    result = await reset_portfolio(portfolio.id, session=session)
    assert portfolio.cash_balance == Decimal("100000")
    assert result.cash_balance == Decimal("100000")
    # Trades, positions and snapshots are each purged.
    assert len(session.executed) == 3
    assert session.flushed is True
    assert portfolio in session.refreshed


async def test_reset_missing_portfolio_raises_404():
    session = _FakeSession(None)
    with pytest.raises(HTTPException) as exc:
        await reset_portfolio(uuid.uuid4(), session=session)
    assert exc.value.status_code == 404
