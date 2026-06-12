from __future__ import annotations
from decimal import Decimal
from portfolio.valuation import (
    PositionValuation,
    total_unrealized_pnl,
    value_position,
)


def test_market_above_entry_yields_positive_unrealized():
    v = value_position(
        quantity=Decimal("2"),
        avg_entry_price=Decimal("100"),
        market_price=Decimal("150"),
    )
    assert v.market_price == Decimal("150")
    assert v.unrealized_pnl == Decimal("100")
    assert v.market_value == Decimal("300")


def test_market_below_entry_yields_negative_unrealized():
    v = value_position(
        quantity=Decimal("3"),
        avg_entry_price=Decimal("200"),
        market_price=Decimal("150"),
    )
    assert v.unrealized_pnl == Decimal("-150")
    assert v.market_value == Decimal("450")


def test_no_market_price_falls_back_to_cost_basis():
    v = value_position(
        quantity=Decimal("4"),
        avg_entry_price=Decimal("250"),
        market_price=None,
    )
    assert v.market_price is None
    assert v.unrealized_pnl is None
    assert v.market_value == Decimal("1000")


def test_zero_quantity_position_has_zero_value_and_pnl():
    v = value_position(
        quantity=Decimal("0"),
        avg_entry_price=Decimal("0"),
        market_price=Decimal("100"),
    )
    assert v.unrealized_pnl == Decimal("0")
    assert v.market_value == Decimal("0")


def test_total_unrealized_pnl_sums_available():
    valuations = [
        PositionValuation(Decimal("10"), Decimal("5"), Decimal("100")),
        PositionValuation(Decimal("20"), Decimal("-3"), Decimal("200")),
        PositionValuation(None, None, Decimal("500")),
    ]
    assert total_unrealized_pnl(valuations) == Decimal("2")


def test_total_unrealized_pnl_returns_none_when_no_prices():
    valuations = [
        PositionValuation(None, None, Decimal("100")),
        PositionValuation(None, None, Decimal("200")),
    ]
    assert total_unrealized_pnl(valuations) is None


def test_total_unrealized_pnl_returns_none_for_empty_list():
    assert total_unrealized_pnl([]) is None
