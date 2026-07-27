from __future__ import annotations
from decimal import Decimal
from portfolio.price_alerts import condition_met, normalize_symbol, parse_price
from common import PriceAlertCondition
import pytest
from fastapi import HTTPException


def test_normalize_symbol_slash_and_usd():
    assert normalize_symbol("btc/usd") == "BTCUSDT"
    assert normalize_symbol("ETH-USDT") == "ETHUSDT"
    assert normalize_symbol("solusdt") == "SOLUSDT"


def test_parse_price_rejects_non_positive():
    with pytest.raises(HTTPException) as exc:
        parse_price("0")
    assert exc.value.status_code == 400


def test_condition_met_above_and_below():
    target = Decimal("100")
    assert condition_met(PriceAlertCondition.ABOVE, target, Decimal("100"))
    assert condition_met(PriceAlertCondition.ABOVE, target, Decimal("101"))
    assert not condition_met(PriceAlertCondition.ABOVE, target, Decimal("99.99"))
    assert condition_met(PriceAlertCondition.BELOW, target, Decimal("100"))
    assert condition_met(PriceAlertCondition.BELOW, target, Decimal("99"))
    assert not condition_met(PriceAlertCondition.BELOW, target, Decimal("100.01"))
