from __future__ import annotations
from datetime import datetime, timezone
from decimal import Decimal
import pytest
from portfolio.risk import (
    EquityPoint,
    RiskMetrics,
    calculate_historical_var_95,
    calculate_max_drawdown,
    calculate_returns,
    calculate_sharpe_ratio,
)


def test_equity_point_is_immutable():
    point = EquityPoint(
        snapshot_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
        total_value=Decimal("100000"),
    )
    with pytest.raises(Exception):
        point.total_value = Decimal("90000")


def test_risk_metrics_allows_missing_metrics():
    metrics = RiskMetrics(
        sharpe_ratio=None,
        max_drawdown=None,
        historical_var_95=None,
    )
    assert metrics.sharpe_ratio is None
    assert metrics.max_drawdown is None
    assert metrics.historical_var_95 is None


@pytest.mark.parametrize(
    "fn",
    [
        calculate_returns,
        calculate_sharpe_ratio,
        calculate_max_drawdown,
        calculate_historical_var_95,
    ],
)
def test_metric_functions_are_explicitly_pending(fn):
    with pytest.raises(NotImplementedError):
        fn([])
