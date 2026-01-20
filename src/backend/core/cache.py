from __future__ import annotations

import asyncio
import json
import logging
import time
from dataclasses import dataclass
from typing import Any, Awaitable, Callable, Dict, Optional, Tuple

import redis.asyncio as aioredis

from backend.settings import redis_url, redis_max_connections

logger = logging.getLogger(__name__)

_pool: Optional[aioredis.ConnectionPool] = None
_redis_instance: Optional[aioredis.Redis] = None


async def init_redis_pool() -> None:
    global _pool, _redis_instance
    url = redis_url()
    if not url:
        logger.info("Redis credentials not configured; using in-memory cache only", extra={"component": "redis"})
        return
    try:
        _pool = aioredis.ConnectionPool.from_url(
            url,
            max_connections=redis_max_connections(),
            decode_responses=True,
        )
        _redis_instance = aioredis.Redis(connection_pool=_pool)
        await _redis_instance.ping()
        logger.info("Redis Enterprise pool initialized", extra={"component": "redis", "max_connections": redis_max_connections()})
    except Exception as e:
        logger.warning("Failed to initialize Redis pool", extra={"component": "redis", "error": str(e)})
        _pool = None
        _redis_instance = None


async def close_redis_pool() -> None:
    global _pool, _redis_instance
    if _redis_instance:
        await _redis_instance.aclose()
        _redis_instance = None
    if _pool:
        await _pool.disconnect()
        _pool = None
        logger.info("Redis pool closed", extra={"component": "redis"})


@dataclass
class CacheEntry:
    value: Any
    stale_at: float
    expires_at: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "value": self.value,
            "stale_at": self.stale_at,
            "expires_at": self.expires_at,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> CacheEntry:
        return cls(
            value=data["value"],
            stale_at=data["stale_at"],
            expires_at=data["expires_at"],
        )


class TTLCache:
    def __init__(self) -> None:
        self._data: Dict[str, CacheEntry] = {}
        self._locks: Dict[str, asyncio.Lock] = {}
        self._global = asyncio.Lock()
        self._refreshing: set[str] = set()

    async def _try_redis_get(self, key: str) -> Optional[CacheEntry]:
        if not _redis_instance:
            return None
        try:
            raw = await _redis_instance.get(key)
            if raw is None:
                return None
            data = json.loads(raw) if isinstance(raw, str) else raw
            entry = CacheEntry.from_dict(data)
            now = time.time()
            if now >= entry.expires_at:
                await _redis_instance.delete(key)
                return None
            return entry
        except Exception as e:
            logger.warning("Redis GET failed", extra={"key": key, "error": str(e)})
            return None

    async def _try_redis_set(self, key: str, entry: CacheEntry, ttl_seconds: int) -> None:
        if not _redis_instance:
            return
        try:
            payload = json.dumps(entry.to_dict())
            await _redis_instance.set(key, payload, ex=ttl_seconds)
        except Exception as e:
            logger.warning("Redis SET failed", extra={"key": key, "error": str(e)})

    async def get_entry(self, key: str) -> Optional[CacheEntry]:
        redis_entry = await self._try_redis_get(key)
        if redis_entry:
            self._data[key] = redis_entry
            return redis_entry
        mem_entry = self._data.get(key)
        if not mem_entry:
            return None
        now = time.time()
        if now >= mem_entry.expires_at:
            self._data.pop(key, None)
            return None
        return mem_entry

    async def set(self, key: str, value: Any, ttl_seconds: int, stale_seconds: int) -> None:
        now = time.time()
        entry = CacheEntry(
            value=value,
            stale_at=now + stale_seconds,
            expires_at=now + ttl_seconds,
        )
        await self._try_redis_set(key, entry, ttl_seconds)
        self._data[key] = entry

    async def lock_for(self, key: str) -> asyncio.Lock:
        async with self._global:
            if key not in self._locks:
                self._locks[key] = asyncio.Lock()
            return self._locks[key]

    async def _refresh_in_background(
        self,
        key: str,
        ttl_seconds: int,
        stale_seconds: int,
        compute: Callable[[], Awaitable[Any]],
    ) -> None:
        async with self._global:
            if key in self._refreshing:
                return
            self._refreshing.add(key)
        try:
            lock = await self.lock_for(key)
            async with lock:
                e = await self.get_entry(key)
                if e and time.time() < e.stale_at:
                    return
                value = await compute()
                await self.set(key, value, ttl_seconds=ttl_seconds, stale_seconds=stale_seconds)
        finally:
            async with self._global:
                self._refreshing.discard(key)

    async def get_or_compute_swr(
        self,
        key: str,
        ttl_seconds: int,
        stale_seconds: int,
        compute: Callable[[], Awaitable[Any]],
    ) -> Tuple[Any, str]:
        e = await self.get_entry(key)
        if e:
            if time.time() < e.stale_at:
                return e.value, "HIT"
            asyncio.create_task(
                self._refresh_in_background(key, ttl_seconds, stale_seconds, compute)
            )
            return e.value, "STALE"
        lock = await self.lock_for(key)
        async with lock:
            e2 = await self.get_entry(key)
            if e2:
                if time.time() < e2.stale_at:
                    return e2.value, "HIT"
                asyncio.create_task(
                    self._refresh_in_background(key, ttl_seconds, stale_seconds, compute)
                )
                return e2.value, "STALE"
            value = await compute()
            await self.set(key, value, ttl_seconds=ttl_seconds, stale_seconds=stale_seconds)
            return value, "MISS"
