from __future__ import annotations
import asyncio
import time
from typing import Awaitable, Callable


class TTLByteCache:
    # Short-lived cache of pre-serialized upstream responses for hot read fan-out (e.g. /prices).
    # Storing the raw upstream bytes lets the gateway skip both the network hop and a JSON
    # decode/re-encode round-trip on a cache hit. A per-key lock turns a concurrent miss stampede
    # into a single upstream fetch (single-flight), so N simultaneous callers cost one hop, not N.
    def __init__(self, ttl_seconds: float) -> None:
        self._ttl = ttl_seconds
        self._store: dict[str, tuple[float, bytes]] = {}
        self._locks: dict[str, asyncio.Lock] = {}

    def _lock(self, key: str) -> asyncio.Lock:
        lock = self._locks.get(key)
        if lock is None:
            lock = asyncio.Lock()
            self._locks[key] = lock
        return lock

    def get(self, key: str) -> bytes | None:
        entry = self._store.get(key)
        if entry is None:
            return None
        expires_at, value = entry
        if expires_at < time.monotonic():
            return None
        return value

    def set(self, key: str, value: bytes) -> None:
        self._store[key] = (time.monotonic() + self._ttl, value)

    async def get_or_load(
        self, key: str, loader: Callable[[], Awaitable[bytes]]
    ) -> bytes:
        if self._ttl <= 0:
            return await loader()
        cached = self.get(key)
        if cached is not None:
            return cached
        async with self._lock(key):
            # A caller that queued on the lock may find the winner already populated the entry.
            cached = self.get(key)
            if cached is not None:
                return cached
            value = await loader()
            self.set(key, value)
            return value

    def clear(self) -> None:
        self._store.clear()
