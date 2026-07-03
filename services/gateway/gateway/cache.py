from __future__ import annotations
import time
from dataclasses import dataclass


@dataclass
class _Entry:
    value: str
    expires_at: float


class TTLCache:
    # Small in-process cache for stable mappings (e.g. clerk_id -> portfolio_id). A monotonic
    # clock avoids wall-clock jumps expiring entries early. Not shared across workers by design:
    # the mapping is immutable, so a per-worker cold miss on first use is the only cost.
    def __init__(self, ttl_seconds: float) -> None:
        self._ttl = ttl_seconds
        self._store: dict[str, _Entry] = {}

    def get(self, key: str) -> str | None:
        entry = self._store.get(key)
        if entry is None:
            return None
        if entry.expires_at < time.monotonic():
            self._store.pop(key, None)
            return None
        return entry.value

    def set(self, key: str, value: str) -> None:
        self._store[key] = _Entry(value, time.monotonic() + self._ttl)

    def invalidate(self, key: str) -> None:
        self._store.pop(key, None)

    def clear(self) -> None:
        self._store.clear()
