from decimal import Decimal
from common import OrderSide
from portfolio.ledger import (
    asset_display_name,
    base_asset,
    format_ledger_amount,
    legs_for_fill,
)


def test_base_asset_strips_quote_suffix():
    assert base_asset("BTCUSDT") == "BTC"
    assert base_asset("ETHUSD") == "ETH"
    assert base_asset("SOL") == "SOL"


def test_asset_display_name_known_and_fallback():
    assert asset_display_name("BTC") == "Bitcoin"
    assert asset_display_name("USD") == "US Dollar"
    assert asset_display_name("DOGE") == "DOGE"


def test_buy_legs_credit_asset_and_debit_cash_with_balances():
    asset_leg, cash_leg = legs_for_fill(
        side=OrderSide.BUY,
        symbol="BTCUSDT",
        quantity=Decimal("0.5"),
        price=Decimal("60000"),
        fee=Decimal("1.25"),
        cash_balance_after=Decimal("69998.75"),
        asset_balance_after=Decimal("0.5"),
    )
    assert asset_leg.entry_type == "trade_buy"
    assert asset_leg.ticker == "BTC"
    assert asset_leg.asset == "Bitcoin"
    assert asset_leg.amount == Decimal("0.5")
    assert asset_leg.fee == Decimal("0")
    assert asset_leg.balance_after == Decimal("0.5")
    assert cash_leg.ticker == "USD"
    assert cash_leg.amount == Decimal("-30000")
    assert cash_leg.fee == Decimal("1.25")
    assert cash_leg.balance_after == Decimal("69998.75")


def test_sell_legs_reverse_signs():
    asset_leg, cash_leg = legs_for_fill(
        side=OrderSide.SELL,
        symbol="ETHUSD",
        quantity=Decimal("2"),
        price=Decimal("3000"),
        fee=Decimal("0"),
        cash_balance_after=Decimal("106000"),
        asset_balance_after=Decimal("1"),
    )
    assert asset_leg.entry_type == "trade_sell"
    assert asset_leg.amount == Decimal("-2")
    assert asset_leg.balance_after == Decimal("1")
    assert cash_leg.amount == Decimal("6000")
    assert cash_leg.balance_after == Decimal("106000")


def test_format_ledger_amount_uses_minus_sign():
    assert format_ledger_amount(Decimal("0.5"), "BTC") == "0.5 BTC"
    assert format_ledger_amount(Decimal("-30000"), "USD") == "−30000 USD"
    assert format_ledger_amount(Decimal("0"), "USD") == "0 USD"
