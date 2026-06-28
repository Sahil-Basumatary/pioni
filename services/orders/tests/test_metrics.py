from __future__ import annotations
import uuid
from datetime import datetime, timezone
from decimal import Decimal
import pytest
from prometheus_client import REGISTRY
from common import OrderSide, OrderType, OrderStatus
from orders.book_types import _FastFill, _FastResult
from orders.metrics import record_submission
from orders.schemas import SubmitOrderRequest


def _counter(name: str, labels: dict[str, str]) -> float:
    return REGISTRY.get_sample_value(name, labels) or 0.0


def _request(symbol: str = "BTC", side: OrderSide = OrderSide.BUY) -> SubmitOrderRequest:
    return SubmitOrderRequest(
        portfolio_id=uuid.uuid4(),
        symbol=symbol,
        side=side,
        order_type=OrderType.LIMIT,
        quantity=Decimal("2"),
        price=Decimal("100"),
    )


def _fill(qty: str, price: str) -> _FastFill:
    return _FastFill(
        maker_order_id=uuid.uuid4(),
        taker_order_id=uuid.uuid4(),
        price=Decimal(price),
        quantity=Decimal(qty),
        timestamp=datetime.now(timezone.utc),
    )


def test_record_submission_counts_order_by_status():
    req = _request(symbol="METR1", side=OrderSide.BUY)
    labels = {
        "symbol": "METR1", "side": "BUY",
        "order_type": "LIMIT", "status": "OPEN",
    }
    before = _counter("orders_submitted_total", labels)
    result = _FastResult(
        order_id=uuid.uuid4(),
        status=OrderStatus.OPEN,
        remaining_quantity=Decimal("2"),
    )
    record_submission(req, result, 0.0003)
    assert _counter("orders_submitted_total", labels) == pytest.approx(before + 1)


def test_record_submission_aggregates_fills_into_trade_metrics():
    req = _request(symbol="METR2", side=OrderSide.BUY)
    trades_before = _counter("trades_executed_total", {"symbol": "METR2", "side": "BUY"})
    base_before = _counter("trade_volume_base_total", {"symbol": "METR2"})
    notional_before = _counter("trade_notional_total", {"symbol": "METR2"})
    result = _FastResult(
        order_id=uuid.uuid4(),
        status=OrderStatus.FILLED,
        remaining_quantity=Decimal("0"),
        fills=[_fill("1", "100"), _fill("1", "102")],
    )
    record_submission(req, result, 0.0005)
    assert _counter(
        "trades_executed_total", {"symbol": "METR2", "side": "BUY"}
    ) == pytest.approx(trades_before + 2)
    assert _counter(
        "trade_volume_base_total", {"symbol": "METR2"}
    ) == pytest.approx(base_before + 2)
    assert _counter(
        "trade_notional_total", {"symbol": "METR2"}
    ) == pytest.approx(notional_before + 202)


def test_record_submission_observes_match_latency():
    req = _request(symbol="METR3")
    count_label = {"symbol": "METR3"}
    before = REGISTRY.get_sample_value(
        "matching_engine_match_duration_seconds_count", count_label
    ) or 0.0
    result = _FastResult(
        order_id=uuid.uuid4(),
        status=OrderStatus.OPEN,
        remaining_quantity=Decimal("2"),
    )
    record_submission(req, result, 0.0007)
    after = REGISTRY.get_sample_value(
        "matching_engine_match_duration_seconds_count", count_label
    )
    assert after == pytest.approx(before + 1)


def test_record_submission_without_fills_leaves_trade_counters_untouched():
    req = _request(symbol="METR4", side=OrderSide.SELL)
    before = _counter("trades_executed_total", {"symbol": "METR4", "side": "SELL"})
    result = _FastResult(
        order_id=uuid.uuid4(),
        status=OrderStatus.REJECTED,
        remaining_quantity=Decimal("2"),
    )
    record_submission(req, result, 0.0001)
    assert _counter(
        "trades_executed_total", {"symbol": "METR4", "side": "SELL"}
    ) == pytest.approx(before)
