from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal


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
    raise NotImplementedError("return calculation lands with Sharpe implementation")


def calculate_sharpe_ratio(points: list[EquityPoint]) -> Decimal | None:
    raise NotImplementedError("sharpe ratio implementation pending")


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
