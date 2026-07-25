from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime
from decimal import ROUND_CEILING, Decimal

TRADING_PERIODS_PER_YEAR = Decimal("365")
VAR_CONFIDENCE_LEVEL = Decimal("0.95")


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
    for previous, current in zip(ordered, ordered[1:], strict=False):
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
    ordered = sorted(points, key=lambda p: p.snapshot_at)
    if len(ordered) < 2:
        return None
    peak = ordered[0].total_value
    if peak <= 0:
        raise ValueError("total_value must be positive")
    max_drawdown = Decimal(0)
    for point in ordered[1:]:
        if point.total_value <= 0:
            raise ValueError("total_value must be positive")
        if point.total_value > peak:
            peak = point.total_value
            continue
        drawdown = (peak - point.total_value) / peak
        if drawdown > max_drawdown:
            max_drawdown = drawdown
    return max_drawdown


def calculate_historical_var_95(points: list[EquityPoint]) -> Decimal | None:
    returns = sorted(calculate_returns(points))
    if not returns:
        return None
    percentile = Decimal(1) - VAR_CONFIDENCE_LEVEL
    rank = int(
        (Decimal(len(returns)) * percentile).to_integral_value(
            rounding=ROUND_CEILING,
        ),
    )
    cutoff = returns[max(rank - 1, 0)]
    return max(Decimal(0), -cutoff)


def calculate_risk_metrics(points: list[EquityPoint]) -> RiskMetrics:
    return RiskMetrics(
        sharpe_ratio=calculate_sharpe_ratio(points),
        max_drawdown=calculate_max_drawdown(points),
        historical_var_95=calculate_historical_var_95(points),
    )
