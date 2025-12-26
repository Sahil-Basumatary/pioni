from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass
from typing import Any, Awaitable, Callable, Dict, Optional, Tuple


@dataclass
class CacheEntry:
  value: Any
  stale_at: float    
  expires_at: float   

class TTLCache:
  def __init__(self) -> None:
    self._data: Dict[str, CacheEntry] = {}
    self._locks: Dict[str, asyncio.Lock] = {}
    self._global = asyncio.Lock()
    self._refreshing: set[str] = set()

  def get_entry(self, key: str) -> Optional[CacheEntry]:
    e = self._data.get(key)
    if not e:
      return None
    now = time.time()
    if now >= e.expires_at:
      self._data.pop(key, None)
      return None
    return e

  def set(self, key: str, value: Any, ttl_seconds: int, stale_seconds: int) -> None:
    now = time.time()
    self._data[key] = CacheEntry(
      value=value,
      stale_at=now + stale_seconds,
      expires_at=now + ttl_seconds,
    )

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