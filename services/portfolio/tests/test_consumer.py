from __future__ import annotations
import json
import uuid
from decimal import Decimal
from unittest.mock import AsyncMock, patch
from portfolio.consumer import TradeConsumer, _PortfolioUpdate, _is_numeric_overflow
from portfolio.state import FillOverflowError


def _update(**overrides) -> _PortfolioUpdate:
    base = dict(
        portfolio_id=uuid.uuid4(),
        cash_balance=Decimal("99500"),
        symbol="BTCUSDT",
        quantity=Decimal("0.5"),
        avg_entry_price=Decimal("65000"),
        realized_pnl=Decimal("0"),
        realized_pnl_delta=Decimal("0"),
    )
    base.update(overrides)
    return _PortfolioUpdate(**base)


async def test_publish_emits_event_to_portfolio_channel():
    redis = AsyncMock()
    consumer = TradeConsumer(rmq=None, session_factory=None, redis=redis)
    update = _update()

    await consumer._publish(update)

    redis.publish.assert_awaited_once()
    channel, raw = redis.publish.await_args.args
    assert channel == f"portfolio:updated:{update.portfolio_id}"
    payload = json.loads(raw)
    assert payload["type"] == "portfolio_update"
    assert payload["portfolio_id"] == str(update.portfolio_id)
    assert payload["cash_balance"] == "99500"
    assert payload["position"] == {
        "symbol": "BTCUSDT",
        "quantity": "0.5",
        "avg_entry_price": "65000",
        "realized_pnl": "0",
    }
    assert payload["realized_pnl_delta"] == "0"


async def test_publish_no_redis_is_a_noop():
    consumer = TradeConsumer(rmq=None, session_factory=None, redis=None)
    await consumer._publish(_update())


async def test_publish_swallows_redis_errors():
    # A flaky publish must not crash the consumer or skip subsequent updates — the trade
    # is already persisted, real-time delivery is best-effort.
    redis = AsyncMock()
    redis.publish.side_effect = RuntimeError("boom")
    consumer = TradeConsumer(rmq=None, session_factory=None, redis=redis)

    await consumer._publish(_update())

    redis.publish.assert_awaited_once()


async def test_publish_serializes_negative_pnl_delta():
    redis = AsyncMock()
    consumer = TradeConsumer(rmq=None, session_factory=None, redis=redis)

    await consumer._publish(_update(realized_pnl_delta=Decimal("-123.45")))

    payload = json.loads(redis.publish.await_args.args[1])
    assert payload["realized_pnl_delta"] == "-123.45"


def test_is_numeric_overflow_detects_asyncpg_message():
    assert _is_numeric_overflow(Exception("numeric field overflow"))
    assert _is_numeric_overflow(Exception("NumericValueOutOfRangeError: boom"))
    assert not _is_numeric_overflow(Exception("connection reset"))


async def test_handle_drops_fill_overflow_without_reraising():
    consumer = TradeConsumer(rmq=None, session_factory=None, redis=None)
    event_id = uuid.uuid4()
    order_id = uuid.uuid4()
    payload = {
        "event_id": str(event_id),
        "trade_id": str(uuid.uuid4()),
        "order_id": str(order_id),
        "portfolio_id": str(uuid.uuid4()),
        "symbol": "BTCUSDT",
        "side": "BUY",
        "quantity": "1",
        "price": "100",
        "fee": "0",
        "maker_order_id": str(uuid.uuid4()),
        "taker_order_id": str(order_id),
        "timestamp": "2026-01-01T00:00:00Z",
    }
    with patch.object(consumer, "_apply", AsyncMock(side_effect=FillOverflowError("boom"))):
        await consumer._handle(payload)
    assert event_id in consumer._seen


async def test_handle_drops_database_numeric_overflow_without_reraising():
    consumer = TradeConsumer(rmq=None, session_factory=None, redis=None)
    event_id = uuid.uuid4()
    order_id = uuid.uuid4()
    payload = {
        "event_id": str(event_id),
        "trade_id": str(uuid.uuid4()),
        "order_id": str(order_id),
        "portfolio_id": str(uuid.uuid4()),
        "symbol": "BTCUSDT",
        "side": "BUY",
        "quantity": "1",
        "price": "100",
        "fee": "0",
        "maker_order_id": str(uuid.uuid4()),
        "taker_order_id": str(order_id),
        "timestamp": "2026-01-01T00:00:00Z",
    }
    with patch.object(
        consumer,
        "_apply",
        AsyncMock(side_effect=Exception("numeric field overflow")),
    ):
        await consumer._handle(payload)
    assert event_id in consumer._seen
