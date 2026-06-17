from __future__ import annotations
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal


@dataclass(frozen=True, slots=True)
class SnapshotValue:
    snapshot_at: datetime
    total_value: Decimal


@dataclass(frozen=True, slots=True)
class DailyPnlPoint:
    date: date
    total_value: Decimal
    daily_pnl: Decimal
    cumulative_pnl: Decimal


def build_daily_pnl_chart(snapshots: list[SnapshotValue]) -> list[DailyPnlPoint]:
    if not snapshots:
        return []
    daily_closes: dict[date, SnapshotValue] = {}
    for snapshot in sorted(snapshots, key=lambda s: s.snapshot_at):
        daily_closes[snapshot.snapshot_at.date()] = snapshot
    ordered = sorted(daily_closes.items())
    baseline = ordered[0][1].total_value
    previous = baseline
    points: list[DailyPnlPoint] = []
    for day, snapshot in ordered:
        total_value = snapshot.total_value
        points.append(
            DailyPnlPoint(
                date=day,
                total_value=total_value,
                daily_pnl=total_value - previous,
                cumulative_pnl=total_value - baseline,
            ),
        )
        previous = total_value
    return points
