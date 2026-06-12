from __future__ import annotations
import json
import uuid
from decimal import Decimal
from unittest.mock import AsyncMock
from portfolio.consumer import TradeConsumer, _PortfolioUpdate


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
