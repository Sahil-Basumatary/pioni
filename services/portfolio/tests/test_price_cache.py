from __future__ import annotations
from decimal import Decimal
from portfolio.price_cache import PriceCache


def test_update_and_get_returns_price():
    cache = PriceCache()
    cache.update("BTCUSDT", Decimal("65000.50"))
    assert cache.get("BTCUSDT") == Decimal("65000.50")


def test_get_unknown_symbol_returns_none():
    cache = PriceCache()
    assert cache.get("DOGE") is None


def test_symbol_lookup_is_case_insensitive():
    cache = PriceCache()
    cache.update("btcusdt", Decimal("65000"))
    assert cache.get("BTCUSDT") == Decimal("65000")
    assert cache.get("btcusdt") == Decimal("65000")


def test_stale_price_returns_none(monkeypatch):
    fake_now = [1000.0]
    monkeypatch.setattr(
        "portfolio.price_cache.time.monotonic", lambda: fake_now[0],
    )
    cache = PriceCache(stale_after_seconds=10.0)
    cache.update("BTCUSDT", Decimal("65000"))
    fake_now[0] += 5
    assert cache.get("BTCUSDT") == Decimal("65000")
    fake_now[0] += 10
    assert cache.get("BTCUSDT") is None


def test_snapshot_excludes_stale_entries(monkeypatch):
    fake_now = [1000.0]
    monkeypatch.setattr(
        "portfolio.price_cache.time.monotonic", lambda: fake_now[0],
    )
    cache = PriceCache(stale_after_seconds=10.0)
    cache.update("BTCUSDT", Decimal("65000"))
    fake_now[0] += 20
    cache.update("ETHUSDT", Decimal("3000"))
    snap = cache.snapshot()
    assert snap == {"ETHUSDT": Decimal("3000")}


async def test_on_trade_parses_string_price():
    cache = PriceCache()
    await cache.on_trade(
        "BTCUSDT",
        {"symbol": "BTCUSDT", "price": "65123.45", "quantity": "0.1"},
    )
    assert cache.get("BTCUSDT") == Decimal("65123.45")


async def test_on_trade_ignores_missing_price():
    cache = PriceCache()
    await cache.on_trade("BTCUSDT", {"symbol": "BTCUSDT"})
    assert cache.get("BTCUSDT") is None


async def test_on_trade_ignores_invalid_price():
    cache = PriceCache()
    await cache.on_trade("BTCUSDT", {"price": "not-a-number"})
    assert cache.get("BTCUSDT") is None
