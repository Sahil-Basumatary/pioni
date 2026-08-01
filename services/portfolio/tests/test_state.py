import uuid
from decimal import Decimal
import pytest
from common import OrderSide
from portfolio.domain import PortfolioState, PositionState
from portfolio.state import apply_fill, apply_fill_to_portfolio


def _empty_position(symbol: str = "BTC") -> PositionState:
    return PositionState(
        portfolio_id=uuid.uuid4(),
        symbol=symbol,
        quantity=Decimal(0),
        avg_entry_price=Decimal(0),
        realized_pnl=Decimal(0),
    )


def _portfolio(cash: str = "100000.00") -> PortfolioState:
    return PortfolioState(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        cash_balance=Decimal(cash),
        initial_balance=Decimal("100000.00"),
    )


def test_buy_on_empty_position_sets_avg_to_fill_price():
    pos = _empty_position()
    result = apply_fill(pos, OrderSide.BUY, Decimal("2"), Decimal("100"))
    assert result.new_position.quantity == Decimal("2")
    assert result.new_position.avg_entry_price == Decimal("100")
    assert result.new_position.realized_pnl == Decimal("0")
    assert result.cash_delta == Decimal("-200")
    assert result.realized_pnl_delta == Decimal("0")


def test_buy_on_existing_position_weighted_average():
    pos = _empty_position()
    after_first = apply_fill(pos, OrderSide.BUY, Decimal("2"), Decimal("100")).new_position
    result = apply_fill(after_first, OrderSide.BUY, Decimal("1"), Decimal("400"))
    assert result.new_position.quantity == Decimal("3")
    assert result.new_position.avg_entry_price == Decimal("200")


def test_buy_with_fee_reflected_in_cash_delta():
    pos = _empty_position()
    result = apply_fill(pos, OrderSide.BUY, Decimal("1"), Decimal("100"), Decimal("0.10"))
    assert result.cash_delta == Decimal("-100.10")
    assert result.new_position.avg_entry_price == Decimal("100")


def test_sell_partial_close_realizes_profit():
    pos = _empty_position()
    after_buy = apply_fill(pos, OrderSide.BUY, Decimal("3"), Decimal("100")).new_position
    result = apply_fill(after_buy, OrderSide.SELL, Decimal("1"), Decimal("150"))
    assert result.new_position.quantity == Decimal("2")
    assert result.new_position.avg_entry_price == Decimal("100")
    assert result.realized_pnl_delta == Decimal("50")
    assert result.new_position.realized_pnl == Decimal("50")
    assert result.cash_delta == Decimal("150")


def test_sell_partial_close_realizes_loss():
    pos = _empty_position()
    after_buy = apply_fill(pos, OrderSide.BUY, Decimal("3"), Decimal("100")).new_position
    result = apply_fill(after_buy, OrderSide.SELL, Decimal("1"), Decimal("80"))
    assert result.realized_pnl_delta == Decimal("-20")


def test_sell_full_close_zeros_quantity():
    pos = _empty_position()
    after_buy = apply_fill(pos, OrderSide.BUY, Decimal("5"), Decimal("100")).new_position
    result = apply_fill(after_buy, OrderSide.SELL, Decimal("5"), Decimal("110"))
    assert result.new_position.quantity == Decimal("0")
    assert result.new_position.is_flat
    assert result.realized_pnl_delta == Decimal("50")


def test_full_close_resets_avg_entry_price():
    pos = _empty_position()
    after_buy = apply_fill(pos, OrderSide.BUY, Decimal("5"), Decimal("100")).new_position
    closed = apply_fill(after_buy, OrderSide.SELL, Decimal("5"), Decimal("110")).new_position
    assert closed.avg_entry_price == Decimal("0")
    reopened = apply_fill(closed, OrderSide.BUY, Decimal("2"), Decimal("250")).new_position
    assert reopened.avg_entry_price == Decimal("250")


def test_sell_with_fee_reduces_realized_pnl():
    pos = _empty_position()
    after_buy = apply_fill(pos, OrderSide.BUY, Decimal("1"), Decimal("100")).new_position
    result = apply_fill(after_buy, OrderSide.SELL, Decimal("1"), Decimal("110"), Decimal("0.50"))
    assert result.realized_pnl_delta == Decimal("9.50")
    assert result.cash_delta == Decimal("109.50")


def test_sell_exceeding_position_raises():
    pos = _empty_position()
    after_buy = apply_fill(pos, OrderSide.BUY, Decimal("2"), Decimal("100")).new_position
    with pytest.raises(ValueError, match="exceeds position"):
        apply_fill(after_buy, OrderSide.SELL, Decimal("3"), Decimal("100"))


def test_buy_sell_cycle_accumulates_realized_pnl():
    pos = _empty_position()
    pos = apply_fill(pos, OrderSide.BUY, Decimal("10"), Decimal("100")).new_position
    pos = apply_fill(pos, OrderSide.SELL, Decimal("4"), Decimal("120")).new_position
    pos = apply_fill(pos, OrderSide.SELL, Decimal("3"), Decimal("90")).new_position
    assert pos.quantity == Decimal("3")
    assert pos.realized_pnl == Decimal("80") + Decimal("-30")


@pytest.mark.parametrize("qty", [Decimal("0"), Decimal("-1")])
def test_invalid_quantity_raises(qty: Decimal):
    pos = _empty_position()
    with pytest.raises(ValueError, match="qty must be positive"):
        apply_fill(pos, OrderSide.BUY, qty, Decimal("100"))


@pytest.mark.parametrize("price", [Decimal("0"), Decimal("-50")])
def test_invalid_price_raises(price: Decimal):
    pos = _empty_position()
    with pytest.raises(ValueError, match="price must be positive"):
        apply_fill(pos, OrderSide.BUY, Decimal("1"), price)


def test_negative_fee_raises():
    pos = _empty_position()
    with pytest.raises(ValueError, match="fee cannot be negative"):
        apply_fill(pos, OrderSide.BUY, Decimal("1"), Decimal("100"), Decimal("-1"))


def test_apply_fill_to_portfolio_updates_cash_and_position():
    portfolio = _portfolio("100000.00")
    position = _empty_position()
    new_portfolio, new_position, realized = apply_fill_to_portfolio(
        portfolio, position, OrderSide.BUY,
        Decimal("10"), Decimal("500"), Decimal("5"),
    )
    assert new_portfolio.cash_balance == Decimal("94995.00")
    assert new_position.quantity == Decimal("10")
    assert new_position.avg_entry_price == Decimal("500")
    assert realized == Decimal("0")


def test_apply_fill_rejects_notional_overflow():
    from portfolio.state import FillOverflowError
    pos = _empty_position()
    with pytest.raises(FillOverflowError, match="notional"):
        apply_fill(pos, OrderSide.BUY, Decimal("1000000000"), Decimal("1000000000"))


def test_apply_fill_to_portfolio_rejects_cash_overflow():
    from portfolio.state import FillOverflowError
    portfolio = PortfolioState(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        cash_balance=Decimal("999999999999"),
        initial_balance=Decimal("999999999999"),
    )
    position = PositionState(
        portfolio_id=portfolio.id,
        symbol="BTC",
        quantity=Decimal("1"),
        avg_entry_price=Decimal("1"),
        realized_pnl=Decimal("0"),
    )
    with pytest.raises(FillOverflowError, match="overflow"):
        apply_fill_to_portfolio(
            portfolio, position, OrderSide.SELL,
            Decimal("1"), Decimal("2"),
        )
