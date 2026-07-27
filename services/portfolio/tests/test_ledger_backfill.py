import uuid
from datetime import datetime, timezone
from decimal import Decimal
from common import OrderSide
from portfolio.ledger_backfill import TradeSnapshot, plan_ledger_backfill


def _trade(
    *,
    side: OrderSide,
    quantity: str,
    price: str,
    fee: str = "0",
    symbol: str = "BTCUSDT",
    trade_id: uuid.UUID | None = None,
    at: datetime | None = None,
) -> TradeSnapshot:
    return TradeSnapshot(
        id=trade_id or uuid.uuid4(),
        symbol=symbol,
        side=side,
        quantity=Decimal(quantity),
        price=Decimal(price),
        fee=Decimal(fee),
        executed_at=at or datetime(2026, 1, 1, tzinfo=timezone.utc),
    )


def test_plan_backfills_missing_buy_with_cash_balance_after():
    portfolio_id = uuid.uuid4()
    user_id = uuid.uuid4()
    trade = _trade(side=OrderSide.BUY, quantity="0.5", price="60000", fee="1.25")
    planned = plan_ledger_backfill(
        portfolio_id=portfolio_id,
        user_id=user_id,
        initial_balance=Decimal("100000"),
        trades=[trade],
        existing_trade_ids=set(),
    )
    assert len(planned) == 1
    assert planned[0].trade_id == trade.id
    asset_leg, cash_leg = planned[0].legs
    assert asset_leg.ticker == "BTC"
    assert asset_leg.amount == Decimal("0.5")
    assert asset_leg.balance_after == Decimal("0.5")
    assert cash_leg.ticker == "USD"
    assert cash_leg.amount == Decimal("-30000")
    assert cash_leg.fee == Decimal("1.25")
    assert cash_leg.balance_after == Decimal("69998.75")


def test_plan_skips_trades_that_already_have_ledger_rows():
    portfolio_id = uuid.uuid4()
    user_id = uuid.uuid4()
    first = _trade(side=OrderSide.BUY, quantity="1", price="100")
    second = _trade(side=OrderSide.BUY, quantity="1", price="200")
    planned = plan_ledger_backfill(
        portfolio_id=portfolio_id,
        user_id=user_id,
        initial_balance=Decimal("100000"),
        trades=[first, second],
        existing_trade_ids={first.id},
    )
    assert len(planned) == 1
    assert planned[0].trade_id == second.id
    _, cash_leg = planned[0].legs
    # Replay still applies the first fill so the second cash balance is correct.
    assert cash_leg.balance_after == Decimal("99700")


def test_plan_sequences_buy_then_sell_balances():
    portfolio_id = uuid.uuid4()
    user_id = uuid.uuid4()
    buy = _trade(side=OrderSide.BUY, quantity="2", price="100")
    sell = _trade(side=OrderSide.SELL, quantity="1", price="150")
    planned = plan_ledger_backfill(
        portfolio_id=portfolio_id,
        user_id=user_id,
        initial_balance=Decimal("100000"),
        trades=[buy, sell],
        existing_trade_ids=set(),
    )
    assert len(planned) == 2
    buy_asset, buy_cash = planned[0].legs
    sell_asset, sell_cash = planned[1].legs
    assert buy_asset.balance_after == Decimal("2")
    assert buy_cash.balance_after == Decimal("99800")
    assert sell_asset.balance_after == Decimal("1")
    assert sell_cash.balance_after == Decimal("99950")


def test_plan_stops_on_inconsistent_sell_without_position():
    portfolio_id = uuid.uuid4()
    user_id = uuid.uuid4()
    bad_sell = _trade(side=OrderSide.SELL, quantity="1", price="100")
    later = _trade(side=OrderSide.BUY, quantity="1", price="100")
    planned = plan_ledger_backfill(
        portfolio_id=portfolio_id,
        user_id=user_id,
        initial_balance=Decimal("100000"),
        trades=[bad_sell, later],
        existing_trade_ids=set(),
    )
    assert planned == []
