from __future__ import annotations

import asyncio
import json
import logging
import time
from dataclasses import dataclass
from typing import Any, Awaitable, Callable, Dict, Optional, Tuple

import redis

from backend.settings import redis_url

logger = logging.getLogger(__name__)

_redis_instance: Optional[redis.Redis] = None
_redis_checked: bool = False


def _redis_client() -> Optional[redis.Redis]:
    global _redis_instance, _redis_checked
    if _redis_checked:
        return _redis_instance

    _redis_checked = True
    url = redis_url()

    if not url:
        logger.info("Redis credentials not configured; using in-memory cache only")
        return None

    try:
        _redis_instance = redis.Redis.from_url(url, decode_responses=True)
        _redis_instance.ping()
        logger.info("Redis Enterprise client initialized")
    except Exception as e:
        logger.warning(f"Failed to initialize Redis client: {e}")
        _redis_instance = None

    return _redis_instance


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

    def _try_redis_get(self, key: str) -> Optional[CacheEntry]:
        redis = _redis_client()
        if not redis:
            return None

        try:
            raw = redis.get(key)
            if raw is None:
                return None

            data = json.loads(raw) if isinstance(raw, str) else raw
            entry = CacheEntry.from_dict(data)

            now = time.time()
            if now >= entry.expires_at:
                redis.delete(key)
                return None

            return entry
        except Exception as e:
            logger.warning(f"Redis GET failed for {key}: {e}")
            return None

    def _try_redis_set(self, key: str, entry: CacheEntry, ttl_seconds: int) -> None:
        redis = _redis_client()
        if not redis:
            return

        try:
            payload = json.dumps(entry.to_dict())
            redis.set(key, payload, ex=ttl_seconds)
        except Exception as e:
            logger.warning(f"Redis SET failed for {key}: {e}")

    def get_entry(self, key: str) -> Optional[CacheEntry]:
        redis_entry = self._try_redis_get(key)
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

    def set(self, key: str, value: Any, ttl_seconds: int, stale_seconds: int) -> None:
        now = time.time()
        entry = CacheEntry(
            value=value,
            stale_at=now + stale_seconds,
            expires_at=now + ttl_seconds,
        )

        self._try_redis_set(key, entry, ttl_seconds)
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
                e = self.get_entry(key)
                if e and time.time() < e.stale_at:
                    return

                value = await compute()
                self.set(key, value, ttl_seconds=ttl_seconds, stale_seconds=stale_seconds)
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
        e = self.get_entry(key)
        if e:
            if time.time() < e.stale_at:
                return e.value, "HIT"

            asyncio.create_task(
                self._refresh_in_background(key, ttl_seconds, stale_seconds, compute)
            )
            return e.value, "STALE"

        lock = await self.lock_for(key)
        async with lock:
            e2 = self.get_entry(key)
            if e2:
                if time.time() < e2.stale_at:
                    return e2.value, "HIT"
                asyncio.create_task(
                    self._refresh_in_background(key, ttl_seconds, stale_seconds, compute)
                )
                return e2.value, "STALE"

            value = await compute()
            self.set(key, value, ttl_seconds=ttl_seconds, stale_seconds=stale_seconds)
            return value, "MISS"
