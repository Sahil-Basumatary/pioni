from decimal import Decimal
from common.numeric_limits import (
    MAX_NOTIONAL,
    MAX_NUMERIC_20_2,
    MAX_NUMERIC_20_8,
    fits_notional,
    fits_numeric_20_2,
    fits_numeric_20_8,
)


def test_numeric_bounds_match_postgres_rules():
    assert fits_numeric_20_8(MAX_NUMERIC_20_8)
    assert not fits_numeric_20_8(Decimal("1000000000000"))
    assert fits_numeric_20_2(MAX_NUMERIC_20_2)
    assert not fits_numeric_20_2(Decimal("1000000000000000000"))


def test_notional_rejects_overflow_product():
    assert fits_notional(Decimal("1"), Decimal("100"))
    assert not fits_notional(Decimal("1000000000000"), Decimal("2"))
    assert MAX_NOTIONAL == MAX_NUMERIC_20_8
