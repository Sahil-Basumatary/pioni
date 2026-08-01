from __future__ import annotations
from decimal import Decimal

# Matches Postgres NUMERIC(20, 8): abs value must stay under 10^12.
MAX_NUMERIC_20_8 = Decimal("999999999999.99999999")
# Matches Postgres NUMERIC(20, 2).
MAX_NUMERIC_20_2 = Decimal("999999999999999999.99")
# Ledger amount/balance_after are NUMERIC(20, 8), so notional must fit that too.
MAX_NOTIONAL = MAX_NUMERIC_20_8


def fits_numeric_20_8(value: Decimal) -> bool:
    return value.copy_abs() <= MAX_NUMERIC_20_8


def fits_numeric_20_2(value: Decimal) -> bool:
    return value.copy_abs() <= MAX_NUMERIC_20_2


def fits_notional(quantity: Decimal, price: Decimal) -> bool:
    return fits_numeric_20_8(quantity * price)
