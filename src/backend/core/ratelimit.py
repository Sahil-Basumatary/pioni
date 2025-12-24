import time
from collections import defaultdict, deque
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


limiter = RateLimiter(
    max_requests=int(__import__("os").getenv("RATE_LIMIT_MAX", "30")),
    window_seconds=int(__import__("os").getenv("RATE_LIMIT_WINDOW_SECONDS", "60")),
)


async def rate_limit_middleware(request: Request, call_next):
    ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (request.client.host if request.client else "unknown")
    key = f"{ip}:{request.url.path}"

    if not limiter.allow(key):
        request_id = getattr(request.state, "request_id", None)
        return JSONResponse(
            status_code=429,
            content={"error": "RATE_LIMIT", "message": "Too many requests.", "request_id": request_id},
        )

    return await call_next(request)