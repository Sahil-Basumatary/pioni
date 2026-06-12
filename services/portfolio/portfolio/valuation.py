from __future__ import annotations
from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True, slots=True)
class PositionValuation:
    market_price: Decimal | None
    unrealized_pnl: Decimal | None
    market_value: Decimal


def value_position(
    *,
    quantity: Decimal,
    avg_entry_price: Decimal,
    market_price: Decimal | None,
) -> PositionValuation:
    # Cost-basis fallback when no live price: market_value still meaningful, but unrealized_pnl
    # is left None so the API never returns a misleading zero that the frontend would render.
    if market_price is None:
        return PositionValuation(
            market_price=None,
            unrealized_pnl=None,
            market_value=quantity * avg_entry_price,
        )
    if quantity <= 0:
        return PositionValuation(
            market_price=market_price,
            unrealized_pnl=Decimal(0),
            market_value=Decimal(0),
        )
    unrealized = (market_price - avg_entry_price) * quantity
    return PositionValuation(
        market_price=market_price,
        unrealized_pnl=unrealized,
        market_value=quantity * market_price,
    )


def total_unrealized_pnl(
    valuations: list[PositionValuation],
) -> Decimal | None:
    # Returns None when no position had a price — distinguishes "we couldn't compute"
    # from "we computed and got zero". Frontend renders these differently.
    available = [v.unrealized_pnl for v in valuations if v.unrealized_pnl is not None]
    if not available:
        return None
    return sum(available, start=Decimal(0))
