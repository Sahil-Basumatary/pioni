import importlib
import json
import time
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
import backend.core.cache as cache_mod


@pytest.fixture(autouse=True)
def reset_cache():
    cache_mod._pool = None
    cache_mod._redis_instance = None
    yield
    cache_mod._pool = None
    cache_mod._redis_instance = None


class TestCacheWithoutRedis:
    @pytest.mark.asyncio
    async def test_in_memory_cache_works(self, monkeypatch):
        monkeypatch.delenv("REDIS_URL", raising=False)
        importlib.reload(cache_mod)
        cache = cache_mod.TTLCache()
        await cache.set("key", {"data": "value"}, ttl_seconds=300, stale_seconds=60)
        entry = await cache.get_entry("key")
        assert entry.value == {"data": "value"}

    @pytest.mark.asyncio
    async def test_in_memory_expiration(self, monkeypatch):
        monkeypatch.delenv("REDIS_URL", raising=False)
        importlib.reload(cache_mod)
        cache = cache_mod.TTLCache()
        await cache.set("temp", "expires", ttl_seconds=1, stale_seconds=0)
        entry = await cache.get_entry("temp")
        assert entry is not None
        time.sleep(1.1)
        entry = await cache.get_entry("temp")
        assert entry is None


class TestCacheWithRedis:
    @pytest.mark.asyncio
    async def test_redis_set_called(self, monkeypatch):
        monkeypatch.setenv("REDIS_URL", "redis://localhost:6379")
        mock_pool = MagicMock()
        mock_redis = AsyncMock()
        mock_redis.ping = AsyncMock(return_value=True)
        mock_redis.get = AsyncMock(return_value=None)
        mock_redis.set = AsyncMock()
        with patch.object(cache_mod.aioredis.ConnectionPool, "from_url", return_value=mock_pool):
            with patch.object(cache_mod.aioredis, "Redis", return_value=mock_redis):
                importlib.reload(cache_mod)
                await cache_mod.init_redis_pool()
                cache = cache_mod.TTLCache()
                await cache.set("k", "v", ttl_seconds=300, stale_seconds=60)
                mock_redis.set.assert_called_once()
                assert mock_redis.set.call_args[0][0] == "k"

    @pytest.mark.asyncio
    async def test_redis_get_returns_data(self, monkeypatch):
        monkeypatch.setenv("REDIS_URL", "redis://localhost:6379")
        cached = {"value": "cached_data", "stale_at": time.time() + 300, "expires_at": time.time() + 600}
        mock_pool = MagicMock()
        mock_redis = AsyncMock()
        mock_redis.ping = AsyncMock(return_value=True)
        mock_redis.get = AsyncMock(return_value=json.dumps(cached))
        with patch.object(cache_mod.aioredis.ConnectionPool, "from_url", return_value=mock_pool):
            with patch.object(cache_mod.aioredis, "Redis", return_value=mock_redis):
                importlib.reload(cache_mod)
                await cache_mod.init_redis_pool()
                cache = cache_mod.TTLCache()
                entry = await cache.get_entry("key")
                assert entry.value == "cached_data"


class TestCacheFallback:
    @pytest.mark.asyncio
    async def test_fallback_on_connection_error(self, monkeypatch):
        monkeypatch.setenv("REDIS_URL", "redis://invalid:6379")
        with patch.object(cache_mod.aioredis.ConnectionPool, "from_url", side_effect=Exception("Connection refused")):
            importlib.reload(cache_mod)
            await cache_mod.init_redis_pool()
            cache = cache_mod.TTLCache()
            await cache.set("k", "v", ttl_seconds=300, stale_seconds=60)
            entry = await cache.get_entry("k")
            assert entry.value == "v"

    @pytest.mark.asyncio
    async def test_fallback_on_get_error(self, monkeypatch):
        monkeypatch.setenv("REDIS_URL", "redis://localhost:6379")
        mock_pool = MagicMock()
        mock_redis = AsyncMock()
        mock_redis.ping = AsyncMock(return_value=True)
        mock_redis.get = AsyncMock(side_effect=Exception("Timeout"))
        with patch.object(cache_mod.aioredis.ConnectionPool, "from_url", return_value=mock_pool):
            with patch.object(cache_mod.aioredis, "Redis", return_value=mock_redis):
                importlib.reload(cache_mod)
                await cache_mod.init_redis_pool()
                cache = cache_mod.TTLCache()
                cache._data["k"] = cache_mod.CacheEntry("local", time.time() + 300, time.time() + 600)
                entry = await cache.get_entry("k")
                assert entry.value == "local"

    @pytest.mark.asyncio
    async def test_fallback_on_set_error(self, monkeypatch):
        monkeypatch.setenv("REDIS_URL", "redis://localhost:6379")
        mock_pool = MagicMock()
        mock_redis = AsyncMock()
        mock_redis.ping = AsyncMock(return_value=True)
        mock_redis.get = AsyncMock(return_value=None)
        mock_redis.set = AsyncMock(side_effect=Exception("Timeout"))
        with patch.object(cache_mod.aioredis.ConnectionPool, "from_url", return_value=mock_pool):
            with patch.object(cache_mod.aioredis, "Redis", return_value=mock_redis):
                importlib.reload(cache_mod)
                await cache_mod.init_redis_pool()
                cache = cache_mod.TTLCache()
                await cache.set("k", "still_works", ttl_seconds=300, stale_seconds=60)
                entry = await cache.get_entry("k")
                assert entry.value == "still_works"
