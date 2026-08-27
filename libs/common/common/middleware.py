import logging
import time
from uuid import uuid4

from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from common.tracing import tag_current_span

logger = logging.getLogger(__name__)


class RequestIdMiddleware:
    # Pure ASGI rather than BaseHTTPMiddleware: the latter wraps every request in an anyio task
    # group and a streaming response shim, which adds latency and caps concurrency on the hot path.
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        request_id = uuid4().hex[:12]
        scope.setdefault("state", {})["request_id"] = request_id
        tag_current_span(**{"request.id": request_id})
        start = time.perf_counter()
        status_code = 0

        async def send_wrapper(message: Message) -> None:
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
                MutableHeaders(scope=message)["X-Request-ID"] = request_id
            await send(message)

        await self.app(scope, receive, send_wrapper)
        latency_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "request completed",
            extra={
                "request_id": request_id,
                "path": scope["path"],
                "method": scope["method"],
                "status_code": status_code,
                "latency_ms": round(latency_ms, 2),
            },
        )
