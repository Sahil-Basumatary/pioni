import asyncio
import pytest
from starlette.responses import Response
from gateway import market_routes


@pytest.mark.asyncio
async def test_get_prices_serves_pre_serialized_bytes(monkeypatch):
    calls = 0

    async def fake_fetch(path):
        nonlocal calls
        calls += 1
        return b'{"BTCUSDT": {"price": "1"}}'

    monkeypatch.setattr(market_routes, "_fetch_bytes", fake_fetch)
    first = await market_routes.get_prices()
    second = await market_routes.get_prices()
    assert isinstance(first, Response)
    assert first.body == b'{"BTCUSDT": {"price": "1"}}'
    assert first.media_type == "application/json"
    assert second.body == first.body
    # The second call is a cache hit, so the upstream is touched only once.
    assert calls == 1


@pytest.mark.asyncio
async def test_concurrent_prices_collapse_to_one_upstream_call(monkeypatch):
    calls = 0

    async def fake_fetch(path):
        nonlocal calls
        calls += 1
        await asyncio.sleep(0.02)
        return b"{}"

    monkeypatch.setattr(market_routes, "_fetch_bytes", fake_fetch)
    await asyncio.gather(*[market_routes.get_prices() for _ in range(20)])
    assert calls == 1


@pytest.mark.asyncio
async def test_per_symbol_prices_uppercase_key(monkeypatch):
    seen = []

    async def fake_fetch(path):
        seen.append(path)
        return b"{}"

    monkeypatch.setattr(market_routes, "_fetch_bytes", fake_fetch)
    await market_routes.get_price("btcusdt")
    assert seen == ["/prices/BTCUSDT"]
