from __future__ import annotations
import asyncio
import logging
from gateway.cache import TTLCache
from gateway.clerk_backend import fetch_verified_email
from gateway.settings import clerk_secret_key, user_email_cache_ttl

logger = logging.getLogger(__name__)

# Clerk's default session token carries no email claim. Resolve once on a cold cache (awaited
# so the first authenticated request can heal the portfolio row), then serve from TTL cache.
# Concurrent cold requests share one in-flight Future so we never stampede Clerk.
_MISSING = ""
_cache = TTLCache(user_email_cache_ttl())
_inflight: dict[str, asyncio.Future[str | None]] = {}


def cached_email(clerk_id: str) -> str | None:
    return _cache.get(clerk_id) or None


async def resolve_email(clerk_id: str) -> str | None:
    hit = _cache.get(clerk_id)
    if hit is not None:
        return hit or None
    if not clerk_secret_key():
        return None
    existing = _inflight.get(clerk_id)
    if existing is not None:
        return await existing
    loop = asyncio.get_running_loop()
    fut: asyncio.Future[str | None] = loop.create_future()
    _inflight[clerk_id] = fut
    try:
        email = await fetch_verified_email(clerk_id)
        # Cache the miss too: an account without a verified address would otherwise trigger a
        # Clerk call on every request it makes.
        _cache.set(clerk_id, email or _MISSING)
        fut.set_result(email)
        return email
    except Exception:
        logger.exception("clerk email refresh failed")
        if not fut.done():
            fut.set_result(None)
        return None
    finally:
        _inflight.pop(clerk_id, None)


def reset_email_cache() -> None:
    _cache.clear()
    _inflight.clear()
