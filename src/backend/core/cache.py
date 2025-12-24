from __future__ import annotations

import time
import asyncio
from dataclasses import dataclass
from typing import Any, Awaitable, Callable, Dict, Optional


@dataclass
class CacheEntry:
    value: Any
    expires_at: float


class TTLCache:
    def __init__(self) -> None:
        self._data: Dict[str, CacheEntry] = {}
        self._locks: Dict[str, asyncio.Lock] = {}
        self._global = asyncio.Lock()

    def get(self, key: str) -> Optional[Any]:
        e = self._data.get(key)
        if not e:
            return None
        if time.time() >= e.expires_at:
            return None
        return e.value

    def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        self._data[key] = CacheEntry(value=value, expires_at=time.time() + ttl_seconds)

    async def lock_for(self, key: str) -> asyncio.Lock:
        async with self._global:
            if key not in self._locks:
                self._locks[key] = asyncio.Lock()
            return self._locks[key]

    async def get_or_compute(
        self,
        key: str,
        ttl_seconds: int,
        compute: Callable[[], Awaitable[Any]],
    ) -> Any:
        cached = self.get(key)
        if cached is not None:
            return cached

        lock = await self.lock_for(key)
        async with lock:
            cached2 = self.get(key)
            if cached2 is not None:
                return cached2

            value = await compute()
            self.set(key, value, ttl_seconds)
            return value