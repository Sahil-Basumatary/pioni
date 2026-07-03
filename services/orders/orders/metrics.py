from __future__ import annotations
from prometheus_client import Counter, Histogram
from common import trace_exemplar
from orders.book_types import _FastResult
from orders.schemas import SubmitOrderRequest

ORDERS_SUBMITTED_TOTAL = Counter(
    "orders_submitted_total",
    "Orders processed by the matching engine, labelled by resulting status",
    ["symbol", "side", "order_type", "status"],
)

TRADES_EXECUTED_TOTAL = Counter(
    "trades_executed_total",
    "Fills produced by the matching engine (one per maker matched)",
    ["symbol", "side"],
)

TRADE_VOLUME_BASE_TOTAL = Counter(
    "trade_volume_base_total",
    "Executed volume denominated in the base asset",
    ["symbol"],
)

TRADE_NOTIONAL_TOTAL = Counter(
    "trade_notional_total",
    "Executed notional denominated in the quote asset (quantity * price)",
    ["symbol"],
)

# Matching is sub-millisecond on a warm book, so the buckets cluster around
# microseconds-to-milliseconds rather than the default web-latency ranges.
MATCH_DURATION_SECONDS = Histogram(
    "matching_engine_match_duration_seconds",
    "Wall-clock time spent inside the matching engine per submitted order",
    ["symbol"],
    buckets=(
        0.00005, 0.0001, 0.00025, 0.0005, 0.001,
        0.0025, 0.005, 0.01, 0.025, 0.05, 0.1,
    ),
)


def record_submission(
    req: SubmitOrderRequest, result: _FastResult, match_seconds: float,
) -> None:
    MATCH_DURATION_SECONDS.labels(req.symbol).observe(
        match_seconds, exemplar=trace_exemplar()
    )
    ORDERS_SUBMITTED_TOTAL.labels(
        req.symbol, req.side.value, req.order_type.value, result.status.value,
    ).inc()
    if not result.fills:
        return
    base = 0.0
    notional = 0.0
    for fill in result.fills:
        qty = float(fill.quantity)
        base += qty
        notional += qty * float(fill.price)
    TRADES_EXECUTED_TOTAL.labels(req.symbol, req.side.value).inc(len(result.fills))
    TRADE_VOLUME_BASE_TOTAL.labels(req.symbol).inc(base)
    TRADE_NOTIONAL_TOTAL.labels(req.symbol).inc(notional)
