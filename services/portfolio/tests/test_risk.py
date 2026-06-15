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


def test_calculate_returns_sorts_by_snapshot_time():
    points = [
        EquityPoint(
            snapshot_at=datetime(2026, 1, 3, tzinfo=timezone.utc),
            total_value=Decimal("132"),
        ),
        EquityPoint(
            snapshot_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
            total_value=Decimal("100"),
        ),
        EquityPoint(
            snapshot_at=datetime(2026, 1, 2, tzinfo=timezone.utc),
            total_value=Decimal("110"),
        ),
    ]
    assert calculate_returns(points) == [Decimal("0.1"), Decimal("0.2")]


def test_calculate_returns_rejects_zero_previous_value():
    points = [
        EquityPoint(
            snapshot_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
            total_value=Decimal("0"),
        ),
        EquityPoint(
            snapshot_at=datetime(2026, 1, 2, tzinfo=timezone.utc),
            total_value=Decimal("100"),
        ),
    ]
    with pytest.raises(ValueError, match="previous total_value must be positive"):
        calculate_returns(points)


def test_calculate_sharpe_ratio_annualizes_daily_returns():
    points = [
        EquityPoint(
            snapshot_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
            total_value=Decimal("100"),
        ),
        EquityPoint(
            snapshot_at=datetime(2026, 1, 2, tzinfo=timezone.utc),
            total_value=Decimal("110"),
        ),
        EquityPoint(
            snapshot_at=datetime(2026, 1, 3, tzinfo=timezone.utc),
            total_value=Decimal("132"),
        ),
        EquityPoint(
            snapshot_at=datetime(2026, 1, 4, tzinfo=timezone.utc),
            total_value=Decimal("171.6"),
        ),
    ]
    assert calculate_sharpe_ratio(points).quantize(Decimal("0.0001")) == Decimal(
        "38.2099",
    )


def test_calculate_sharpe_ratio_returns_none_for_too_few_returns():
    points = [
        EquityPoint(
            snapshot_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
            total_value=Decimal("100"),
        ),
        EquityPoint(
            snapshot_at=datetime(2026, 1, 2, tzinfo=timezone.utc),
            total_value=Decimal("110"),
        ),
    ]
    assert calculate_sharpe_ratio(points) is None


def test_calculate_sharpe_ratio_returns_none_for_zero_volatility():
    points = [
        EquityPoint(
            snapshot_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
            total_value=Decimal("100"),
        ),
        EquityPoint(
            snapshot_at=datetime(2026, 1, 2, tzinfo=timezone.utc),
            total_value=Decimal("110"),
        ),
        EquityPoint(
            snapshot_at=datetime(2026, 1, 3, tzinfo=timezone.utc),
            total_value=Decimal("121"),
        ),
    ]
    assert calculate_sharpe_ratio(points) is None


@pytest.mark.parametrize(
    "fn",
    [
        calculate_max_drawdown,
        calculate_historical_var_95,
    ],
)
def test_metric_functions_are_explicitly_pending(fn):
    with pytest.raises(NotImplementedError):
        fn([])
