import os
import time
from collections import deque
from typing import Callable
from starlette.datastructures import Headers
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send


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


def _rate_limit_enabled() -> bool:
    return os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"


def _cors_headers_for(origin: str | None, get_cors_origins: Callable[[], list[str]]) -> dict:
    if not origin or origin not in get_cors_origins():
        return {}
    return {
        "Access-Control-Allow-Origin": origin,
        "Vary": "Origin",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "*",
    }


class RateLimitMiddleware:
    # Pure ASGI so the allow path (the overwhelming majority of requests) is a dict lookup and a
    # deque trim with no BaseHTTPMiddleware wrapping. Only the rare 429 path builds a response.
    _SKIP_PREFIXES = (
        "/health",
        "/orderbook",
        "/market/",
        "/metrics",
    )

    def __init__(
        self,
        app: ASGIApp,
        get_cors_origins: Callable[[], list[str]],
        max_requests: int | None = None,
        window_seconds: int | None = None,
    ) -> None:
        self.app = app
        self._get_cors_origins = get_cors_origins
        _max = max_requests or int(
            os.getenv("RATE_LIMIT_MAX_REQUESTS", os.getenv("RATE_LIMIT_MAX", "120"))
        )
        _window = window_seconds or int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))
        self._limiter = RateLimiter(max_requests=_max, window_seconds=_window)

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or scope["method"] == "OPTIONS" or not _rate_limit_enabled():
            await self.app(scope, receive, send)
            return
        path = scope.get("path", "")
        if scope["method"] == "GET" and path.startswith(self._SKIP_PREFIXES):
            await self.app(scope, receive, send)
            return
        headers = Headers(scope=scope)
        xff = headers.get("x-forwarded-for", "")
        ip = xff.split(",")[0].strip() if xff else (
            (scope.get("client") or ("unknown",))[0]
        )
        key = f"{ip}:{path}"
        if self._limiter.allow(key):
            await self.app(scope, receive, send)
            return
        request_id = scope.get("state", {}).get("request_id")
        response = JSONResponse(
            status_code=429,
            content={"error": "RATE_LIMIT", "message": "Too many requests.", "request_id": request_id},
            headers=_cors_headers_for(headers.get("origin"), self._get_cors_origins),
        )
        await response(scope, receive, send)
