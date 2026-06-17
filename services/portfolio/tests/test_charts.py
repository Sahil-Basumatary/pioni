from __future__ import annotations
from datetime import datetime, timezone
from decimal import Decimal
from portfolio.charts import SnapshotValue, build_daily_pnl_chart


def _snapshot(day: int, value: str, hour: int = 0) -> SnapshotValue:
    return SnapshotValue(
        snapshot_at=datetime(2026, 1, day, hour, tzinfo=timezone.utc),
        total_value=Decimal(value),
    )


def test_build_daily_pnl_chart_returns_empty_for_no_snapshots():
    assert build_daily_pnl_chart([]) == []


def test_build_daily_pnl_chart_calculates_daily_and_cumulative_pnl():
    points = build_daily_pnl_chart([
        _snapshot(1, "100000"),
        _snapshot(2, "101500"),
        _snapshot(3, "99000"),
    ])
    assert [p.date.isoformat() for p in points] == [
        "2026-01-01",
        "2026-01-02",
        "2026-01-03",
    ]
    assert [p.daily_pnl for p in points] == [
        Decimal("0"),
        Decimal("1500"),
        Decimal("-2500"),
    ]
    assert [p.cumulative_pnl for p in points] == [
        Decimal("0"),
        Decimal("1500"),
        Decimal("-1000"),
    ]


def test_build_daily_pnl_chart_uses_latest_snapshot_per_day():
    points = build_daily_pnl_chart([
        _snapshot(1, "100000", hour=9),
        _snapshot(1, "101000", hour=23),
        _snapshot(2, "102500", hour=23),
    ])
    assert len(points) == 2
    assert points[0].total_value == Decimal("101000")
    assert points[1].daily_pnl == Decimal("1500")


def test_build_daily_pnl_chart_sorts_unsorted_snapshots():
    points = build_daily_pnl_chart([
        _snapshot(3, "120"),
        _snapshot(1, "100"),
        _snapshot(2, "110"),
    ])
    assert [p.total_value for p in points] == [
        Decimal("100"),
        Decimal("110"),
        Decimal("120"),
    ]
