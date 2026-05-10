from __future__ import annotations
from dataclasses import dataclass
from decimal import Decimal
from common import OrderSide
from portfolio.domain import PortfolioState, PositionState


@dataclass(frozen=True, slots=True)
class FillApplication:
    new_position: PositionState
    cash_delta: Decimal
    realized_pnl_delta: Decimal


def apply_fill(
    position: PositionState,
    side: OrderSide,
    qty: Decimal,
    price: Decimal,
    fee: Decimal = Decimal(0),
) -> FillApplication:
    if qty <= 0:
        raise ValueError(f"fill qty must be positive, got {qty}")
    if price <= 0:
        raise ValueError(f"fill price must be positive, got {price}")
    if fee < 0:
        raise ValueError(f"fee cannot be negative, got {fee}")
    if side == OrderSide.BUY:
        return _apply_buy(position, qty, price, fee)
    return _apply_sell(position, qty, price, fee)


def _apply_buy(
    position: PositionState, qty: Decimal, price: Decimal, fee: Decimal,
) -> FillApplication:
    new_qty = position.quantity + qty
    new_avg = (
        position.quantity * position.avg_entry_price + qty * price
    ) / new_qty
    return FillApplication(
        new_position=PositionState(
            portfolio_id=position.portfolio_id,
            symbol=position.symbol,
            quantity=new_qty,
            avg_entry_price=new_avg,
            realized_pnl=position.realized_pnl,
        ),
        cash_delta=-(qty * price + fee),
        realized_pnl_delta=Decimal(0),
    )


def _apply_sell(
    position: PositionState, qty: Decimal, price: Decimal, fee: Decimal,
) -> FillApplication:
    if qty > position.quantity:
        raise ValueError(
            f"sell qty {qty} exceeds position qty {position.quantity}",
        )
    # Realized P&L is proceeds above cost basis, less fees
    new_qty = position.quantity - qty
    realized_increment = (price - position.avg_entry_price) * qty - fee
    new_avg = Decimal(0) if new_qty == 0 else position.avg_entry_price
    return FillApplication(
        new_position=PositionState(
            portfolio_id=position.portfolio_id,
            symbol=position.symbol,
            quantity=new_qty,
            avg_entry_price=new_avg,
            realized_pnl=position.realized_pnl + realized_increment,
        ),
        cash_delta=qty * price - fee,
        realized_pnl_delta=realized_increment,
    )


def apply_fill_to_portfolio(
    portfolio: PortfolioState,
    position: PositionState,
    side: OrderSide,
    qty: Decimal,
    price: Decimal,
    fee: Decimal = Decimal(0),
) -> tuple[PortfolioState, PositionState, Decimal]:
    fill = apply_fill(position, side, qty, price, fee)
    new_portfolio = PortfolioState(
        id=portfolio.id,
        user_id=portfolio.user_id,
        cash_balance=portfolio.cash_balance + fill.cash_delta,
        initial_balance=portfolio.initial_balance,
    )
    return new_portfolio, fill.new_position, fill.realized_pnl_delta
