from decimal import Decimal
from orders.ladder import build_ladder, price_moved_enough


def test_build_ladder_places_symmetric_bids_and_asks():
    levels = build_ladder(
        Decimal("100"),
        levels=3,
        spread_bps=Decimal("100"),
        notional_usd=Decimal("1000"),
    )
    bids = [l for l in levels if l.side == "BUY"]
    asks = [l for l in levels if l.side == "SELL"]
    assert len(bids) == 3
    assert len(asks) == 3
    assert bids[0].price == Decimal("99.00")
    assert asks[0].price == Decimal("101.00")
    assert bids[0].quantity == Decimal("10")


def test_build_ladder_rejects_non_positive_mid():
    assert build_ladder(
        Decimal("0"),
        levels=2,
        spread_bps=Decimal("10"),
        notional_usd=Decimal("100"),
    ) == []


def test_price_moved_enough():
    assert price_moved_enough(None, Decimal("100"), Decimal("3")) is True
    assert price_moved_enough(Decimal("100"), Decimal("100.02"), Decimal("3")) is False
    assert price_moved_enough(Decimal("100"), Decimal("100.05"), Decimal("3")) is True
