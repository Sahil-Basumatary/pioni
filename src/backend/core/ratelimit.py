import os
import time
from collections import deque
from fastapi import Request
from starlette.responses import JSONResponse

from backend.settings import cors_origins

class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.hits: dict[str, deque] = {}
        self._call_count = 0

    def allow(self, key: str) -> bool:
        now = time.time()
        self._call_count += 1
        if key not in self.hits:
            self.hits[key] = deque()
        q = self.hits[key]
        while q and (now - q[0]) > self.window_seconds:
            q.popleft()
        if len(q) >= self.max_requests:
            return False
        q.append(now)
        if self._call_count >= 1000:
            self._cleanup(now)
        return True

    def _cleanup(self, now: float) -> None:
        stale = [k for k, v in self.hits.items()
                 if not v or (now - v[-1]) > self.window_seconds]
        for k in stale:
            del self.hits[k]
        self._call_count = 0

MAX_REQUESTS = int(os.getenv("RATE_LIMIT_MAX_REQUESTS", os.getenv("RATE_LIMIT_MAX", "30")))
WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))

limiter = RateLimiter(max_requests=MAX_REQUESTS, window_seconds=WINDOW_SECONDS)

def _rate_limit_enabled() -> bool:
    return os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"

def _cors_headers_for(request: Request) -> dict:
    origin = request.headers.get("origin")
    if not origin:
        return {}

    allowed = cors_origins()
    if origin not in allowed:
        return {}

    return {
        "Access-Control-Allow-Origin": origin,
        "Vary": "Origin",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "*",
    }

async def rate_limit_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)

    if not _rate_limit_enabled():
        return await call_next(request)

    ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (
        request.client.host if request.client else "unknown"
    )
    key = f"{ip}:{request.url.path}"

    if not limiter.allow(key):
        request_id = getattr(request.state, "request_id", None)
        headers = _cors_headers_for(request)
        return JSONResponse(
            status_code=429,
            content={"error": "RATE_LIMIT", "message": "Too many requests.", "request_id": request_id},
            headers=headers,
        )

    return await call_next(request)