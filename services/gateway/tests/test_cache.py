import asyncio
import pytest
import gateway.me_routes as me_routes
from gateway.auth import AuthContext
from gateway.cache import TTLCache


class _CountingResponse:
    def __init__(self, payload):
        self.status_code = 200
        self._payload = payload

    def json(self):
        return self._payload


class _CountingClient:
    def __init__(self):
        self.count = 0

    async def get(self, url, headers=None):
        self.count += 1
        return _CountingResponse({"id": f"p_{self.count}"})


class _ExplodingClient:
    async def get(self, url, headers=None):
        raise AssertionError("portfolio service must not be called for this tier")


def _wire_client(monkeypatch, client):
    async def _get():
        return client

    monkeypatch.setattr(me_routes, "_get_client", _get)


def _disable_backfill(monkeypatch):
    async def _noop_get(key):
        return None

    async def _noop_set(key, value, ttl):
        return None

    async def _noop_sync(clerk_id, portfolio_id):
        return None

    monkeypatch.setattr(me_routes, "redis_get", _noop_get)
    monkeypatch.setattr(me_routes, "redis_set", _noop_set)
    monkeypatch.setattr(me_routes, "_sync_clerk_metadata", _noop_sync)


def test_ttl_cache_hit_and_miss():
    cache = TTLCache(ttl_seconds=100)
    assert cache.get("k") is None
    cache.set("k", "v")
    assert cache.get("k") == "v"


def test_ttl_cache_expires(monkeypatch):
    times = iter([0.0, 200.0])
    monkeypatch.setattr("gateway.cache.time.monotonic", lambda: next(times))
    cache = TTLCache(ttl_seconds=100)
    cache.set("k", "v")
    assert cache.get("k") is None


@pytest.mark.asyncio
async def test_resolve_caches_portfolio_id(monkeypatch):
    _disable_backfill(monkeypatch)
    fake = _CountingClient()
    _wire_client(monkeypatch, fake)
    ctx = AuthContext(clerk_id="user_cache")
    first = await me_routes.resolve_portfolio_id(ctx)
    second = await me_routes.resolve_portfolio_id(ctx)
    assert first == second == "p_1"
    assert fake.count == 1


@pytest.mark.asyncio
async def test_resolve_scopes_cache_per_user(monkeypatch):
    _disable_backfill(monkeypatch)
    fake = _CountingClient()
    _wire_client(monkeypatch, fake)
    a = await me_routes.resolve_portfolio_id(AuthContext(clerk_id="user_a"))
    b = await me_routes.resolve_portfolio_id(AuthContext(clerk_id="user_b"))
    assert a != b
    assert fake.count == 2


@pytest.mark.asyncio
async def test_resolve_prefers_jwt_claim(monkeypatch):
    _disable_backfill(monkeypatch)
    _wire_client(monkeypatch, _ExplodingClient())
    ctx = AuthContext(clerk_id="user_claim", portfolio_id="P_CLAIM")
    assert await me_routes.resolve_portfolio_id(ctx) == "P_CLAIM"


@pytest.mark.asyncio
async def test_resolve_reads_from_redis(monkeypatch):
    async def _hit(key):
        return "P_REDIS"

    monkeypatch.setattr(me_routes, "redis_get", _hit)
    _wire_client(monkeypatch, _ExplodingClient())
    ctx = AuthContext(clerk_id="user_redis")
    assert await me_routes.resolve_portfolio_id(ctx) == "P_REDIS"


@pytest.mark.asyncio
async def test_resolve_cold_path_backfills_redis_and_clerk(monkeypatch):
    async def _miss(key):
        return None

    redis_writes: list = []
    clerk_writes: list = []

    async def _capture_set(key, value, ttl):
        redis_writes.append((key, value, ttl))

    async def _capture_sync(clerk_id, portfolio_id):
        clerk_writes.append((clerk_id, portfolio_id))

    monkeypatch.setattr(me_routes, "redis_get", _miss)
    monkeypatch.setattr(me_routes, "redis_set", _capture_set)
    monkeypatch.setattr(me_routes, "_sync_clerk_metadata", _capture_sync)
    _wire_client(monkeypatch, _CountingClient())
    ctx = AuthContext(clerk_id="user_cold")
    result = await me_routes.resolve_portfolio_id(ctx)
    assert result == "p_1"
    await asyncio.sleep(0.05)
    assert redis_writes and redis_writes[0][1] == "p_1"
    assert clerk_writes == [("user_cold", "p_1")]
