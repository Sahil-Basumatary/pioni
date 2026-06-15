from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal

TRADING_PERIODS_PER_YEAR = Decimal("365")


@dataclass(frozen=True, slots=True)
class EquityPoint:
    snapshot_at: datetime
    total_value: Decimal


@dataclass(frozen=True, slots=True)
class RiskMetrics:
    sharpe_ratio: Decimal | None
    max_drawdown: Decimal | None
    historical_var_95: Decimal | None


def calculate_returns(points: list[EquityPoint]) -> list[Decimal]:
    ordered = sorted(points, key=lambda p: p.snapshot_at)
    returns: list[Decimal] = []
    for previous, current in zip(ordered, ordered[1:]):
        if previous.total_value <= 0:
            raise ValueError("previous total_value must be positive")
        returns.append((current.total_value - previous.total_value) / previous.total_value)
    return returns


def calculate_sharpe_ratio(points: list[EquityPoint]) -> Decimal | None:
    returns = calculate_returns(points)
    if len(returns) < 2:
        return None
    mean_return = sum(returns, start=Decimal(0)) / Decimal(len(returns))
    variance = sum(
        ((r - mean_return) ** 2 for r in returns),
        start=Decimal(0),
    ) / Decimal(len(returns) - 1)
    if variance == 0:
        return None
    return mean_return / variance.sqrt() * TRADING_PERIODS_PER_YEAR.sqrt()


def calculate_max_drawdown(points: list[EquityPoint]) -> Decimal | None:
    raise NotImplementedError("max drawdown implementation pending")


def calculate_historical_var_95(points: list[EquityPoint]) -> Decimal | None:
    raise NotImplementedError("historical VaR implementation pending")


def calculate_risk_metrics(points: list[EquityPoint]) -> RiskMetrics:
    return RiskMetrics(
        sharpe_ratio=calculate_sharpe_ratio(points),
        max_drawdown=calculate_max_drawdown(points),
        historical_var_95=calculate_historical_var_95(points),
    )
