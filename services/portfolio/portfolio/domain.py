from __future__ import annotations
import uuid
from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True, slots=True)
class PositionState:
    portfolio_id: uuid.UUID
    symbol: str
    quantity: Decimal
    avg_entry_price: Decimal
    realized_pnl: Decimal

    @property
    def is_open(self) -> bool:
        return self.quantity > 0

    @property
    def is_flat(self) -> bool:
        return self.quantity == 0


@dataclass(frozen=True, slots=True)
class PortfolioState:
    id: uuid.UUID
    user_id: uuid.UUID
    cash_balance: Decimal
    initial_balance: Decimal
