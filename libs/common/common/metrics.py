import os
import time
from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request, Response
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    CollectorRegistry,
    Counter,
    Histogram,
    generate_latest,
    multiprocess,
)
from starlette.responses import PlainTextResponse

METRICS_PATH = "/metrics"
UNMATCHED_ROUTE = "__unmatched__"

HTTP_REQUESTS_TOTAL = Counter(
    "http_requests_total",
    "Total HTTP requests processed",
    ["service", "method", "path", "status"],
)

HTTP_REQUEST_DURATION_SECONDS = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["service", "method", "path"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0),
)


def _route_template(request: Request) -> str:
    # Label on the matched route template (/portfolios/{portfolio_id}), never the raw path.
    # Raw paths carry IDs and would give Prometheus unbounded label cardinality.
    route = request.scope.get("route")
    if route is not None:
        return getattr(route, "path", UNMATCHED_ROUTE)
    return UNMATCHED_ROUTE


def create_metrics_middleware(
    service_name: str,
) -> Callable[[Request, Callable[[Request], Awaitable[Response]]], Awaitable[Response]]:
    async def metrics_middleware(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        duration = time.perf_counter() - start
        path = _route_template(request)
        if path == METRICS_PATH:
            return response
        HTTP_REQUESTS_TOTAL.labels(
            service_name, request.method, path, str(response.status_code)
        ).inc()
        HTTP_REQUEST_DURATION_SECONDS.labels(
            service_name, request.method, path
        ).observe(duration)
        return response

    return metrics_middleware


def render_metrics() -> Response:
    # With multiple workers each process writes samples into PROMETHEUS_MULTIPROC_DIR.
    # The scrape must merge them so /metrics reflects the whole service, not one worker.
    multiproc_dir = os.getenv("PROMETHEUS_MULTIPROC_DIR")
    if multiproc_dir:
        registry = CollectorRegistry()
        multiprocess.MultiProcessCollector(registry)
        payload = generate_latest(registry)
    else:
        payload = generate_latest()
    return PlainTextResponse(payload, media_type=CONTENT_TYPE_LATEST)


def instrument_app(app: FastAPI, service_name: str) -> None:
    app.middleware("http")(create_metrics_middleware(service_name))

    @app.get(METRICS_PATH, include_in_schema=False)
    async def metrics() -> Response:
        return render_metrics()
