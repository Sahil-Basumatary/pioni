import asyncio
import pytest
from gateway.response_cache import TTLByteCache


@pytest.mark.asyncio
async def test_get_or_load_populates_and_serves_from_cache():
    cache = TTLByteCache(ttl_seconds=5.0)
    calls = 0

    async def loader():
        nonlocal calls
        calls += 1
        return b"payload"

    first = await cache.get_or_load("k", loader)
    second = await cache.get_or_load("k", loader)
    assert first == second == b"payload"
    assert calls == 1


@pytest.mark.asyncio
async def test_entry_expires_after_ttl():
    cache = TTLByteCache(ttl_seconds=0.05)
    cache.set("k", b"v")
    assert cache.get("k") == b"v"
    await asyncio.sleep(0.06)
    assert cache.get("k") is None


@pytest.mark.asyncio
async def test_zero_ttl_disables_cache():
    cache = TTLByteCache(ttl_seconds=0.0)
    calls = 0

    async def loader():
        nonlocal calls
        calls += 1
        return b"v"

    await cache.get_or_load("k", loader)
    await cache.get_or_load("k", loader)
    assert calls == 2


@pytest.mark.asyncio
async def test_concurrent_misses_collapse_to_single_load():
    cache = TTLByteCache(ttl_seconds=5.0)
    calls = 0

    async def loader():
        nonlocal calls
        calls += 1
        await asyncio.sleep(0.02)
        return b"v"

    results = await asyncio.gather(
        *[cache.get_or_load("k", loader) for _ in range(25)]
    )
    assert all(r == b"v" for r in results)
    assert calls == 1


@pytest.mark.asyncio
async def test_loader_error_is_not_cached():
    cache = TTLByteCache(ttl_seconds=5.0)

    async def failing():
        raise RuntimeError("upstream down")

    with pytest.raises(RuntimeError):
        await cache.get_or_load("k", failing)
    assert cache.get("k") is None
