import importlib
import json
import time
from unittest.mock import MagicMock, patch
import pytest
import backend.core.cache as cache_mod

@pytest.fixture(autouse=True)
def reset_cache():
    cache_mod._redis_instance = None
    cache_mod._redis_checked = False
    yield
    cache_mod._redis_instance = None
    cache_mod._redis_checked = False

class TestCacheWithoutRedis:
    def test_in_memory_cache_works(self, monkeypatch):
        monkeypatch.delenv("REDIS_URL", raising=False)
        importlib.reload(cache_mod)

        cache = cache_mod.TTLCache()
        cache.set("key", {"data": "value"}, ttl_seconds=300, stale_seconds=60)
        assert cache.get_entry("key").value == {"data": "value"}

    def test_in_memory_expiration(self, monkeypatch):
        monkeypatch.delenv("REDIS_URL", raising=False)
        importlib.reload(cache_mod)

        cache = cache_mod.TTLCache()
        cache.set("temp", "expires", ttl_seconds=1, stale_seconds=0)
        assert cache.get_entry("temp") is not None
        time.sleep(1.1)
        assert cache.get_entry("temp") is None

class TestCacheWithRedis:
    def test_redis_set_called(self, monkeypatch):
        monkeypatch.setenv("REDIS_URL", "redis://localhost:6379")
        mock_redis = MagicMock()
        mock_redis.ping.return_value = True
        mock_redis.get.return_value = None

        with patch.object(cache_mod.redis.Redis, "from_url", return_value=mock_redis):
            importlib.reload(cache_mod)
            cache = cache_mod.TTLCache()
            cache.set("k", "v", ttl_seconds=300, stale_seconds=60)
            mock_redis.set.assert_called_once()
            assert mock_redis.set.call_args[0][0] == "k"

    def test_redis_get_returns_data(self, monkeypatch):
        monkeypatch.setenv("REDIS_URL", "redis://localhost:6379")
        cached = {"value": "cached_data", "stale_at": time.time() + 300, "expires_at": time.time() + 600}
        mock_redis = MagicMock()
        mock_redis.ping.return_value = True
        mock_redis.get.return_value = json.dumps(cached)

        with patch.object(cache_mod.redis.Redis, "from_url", return_value=mock_redis):
            importlib.reload(cache_mod)
            cache = cache_mod.TTLCache()
            assert cache.get_entry("key").value == "cached_data"

class TestCacheFallback:
    def test_fallback_on_connection_error(self, monkeypatch):
        monkeypatch.setenv("REDIS_URL", "redis://invalid:6379")
        with patch.object(cache_mod.redis.Redis, "from_url", side_effect=Exception("Connection refused")):
            importlib.reload(cache_mod)
            cache = cache_mod.TTLCache()
            cache.set("k", "v", ttl_seconds=300, stale_seconds=60)
            assert cache.get_entry("k").value == "v"

    def test_fallback_on_get_error(self, monkeypatch):
        monkeypatch.setenv("REDIS_URL", "redis://localhost:6379")
        mock_redis = MagicMock()
        mock_redis.ping.return_value = True
        mock_redis.get.side_effect = Exception("Timeout")

        with patch.object(cache_mod.redis.Redis, "from_url", return_value=mock_redis):
            importlib.reload(cache_mod)
            cache = cache_mod.TTLCache()
            cache._data["k"] = cache_mod.CacheEntry("local", time.time() + 300, time.time() + 600)
            assert cache.get_entry("k").value == "local"

    def test_fallback_on_set_error(self, monkeypatch):
        monkeypatch.setenv("REDIS_URL", "redis://localhost:6379")
        mock_redis = MagicMock()
        mock_redis.ping.return_value = True
        mock_redis.get.return_value = None
        mock_redis.set.side_effect = Exception("Timeout")

        with patch.object(cache_mod.redis.Redis, "from_url", return_value=mock_redis):
            importlib.reload(cache_mod)
            cache = cache_mod.TTLCache()
            cache.set("k", "still_works", ttl_seconds=300, stale_seconds=60)
            assert cache.get_entry("k").value == "still_works"
