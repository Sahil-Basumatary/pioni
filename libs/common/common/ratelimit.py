import os
import time
from collections import defaultdict, deque
from typing import Callable
from fastapi import Request
from starlette.responses import JSONResponse


class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.hits = defaultdict(deque)

    def allow(self, key: str) -> bool:
        now = time.time()
        q = self.hits[key]
        while q and (now - q[0]) > self.window_seconds:
            q.popleft()
        if len(q) >= self.max_requests:
            return False
        q.append(now)
        return True


def _rate_limit_enabled() -> bool:
    return os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"


def _cors_headers_for(request: Request, get_cors_origins: Callable[[], list[str]]) -> dict:
    origin = request.headers.get("origin")
    if not origin:
        return {}
    allowed = get_cors_origins()
    if origin not in allowed:
        return {}
    return {
        "Access-Control-Allow-Origin": origin,
        "Vary": "Origin",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "*",
    }


def create_rate_limit_middleware(
    get_cors_origins: Callable[[], list[str]],
    max_requests: int | None = None,
    window_seconds: int | None = None,
):
    _max = max_requests or int(os.getenv("RATE_LIMIT_MAX_REQUESTS", os.getenv("RATE_LIMIT_MAX", "30")))
    _window = window_seconds or int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
    limiter = RateLimiter(max_requests=_max, window_seconds=_window)

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
            headers = _cors_headers_for(request, get_cors_origins)
            return JSONResponse(
                status_code=429,
                content={"error": "RATE_LIMIT", "message": "Too many requests.", "request_id": request_id},
                headers=headers,
            )
        return await call_next(request)

    return rate_limit_middleware

