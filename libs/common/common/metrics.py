import os
import time
from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request, Response
from prometheus_client import (
    REGISTRY,
    CollectorRegistry,
    Counter,
    Histogram,
    multiprocess,
)
from prometheus_client.exposition import choose_encoder
from starlette.responses import PlainTextResponse

from common.tracing import current_trace_ids

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


def trace_exemplar() -> dict[str, str] | None:
    if os.getenv("PROMETHEUS_MULTIPROC_DIR"):
        return None
    ids = current_trace_ids()
    if ids is None:
        return None
    return {"trace_id": ids[0]}


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
        ).observe(duration, exemplar=trace_exemplar())
        return response

    return metrics_middleware


def render_metrics(accept_header: str = "") -> Response:
    # With multiple workers each process writes samples into PROMETHEUS_MULTIPROC_DIR.
    # The scrape must merge them so /metrics reflects the whole service
    multiproc_dir = os.getenv("PROMETHEUS_MULTIPROC_DIR")
    if multiproc_dir:
        registry = CollectorRegistry()
        multiprocess.MultiProcessCollector(registry)
    else:
        registry = REGISTRY
    # Content negotiation hands the OpenMetrics encoder to scrapers that ask for it,
    # which is the only exposition format that carries exemplars.
    encoder, content_type = choose_encoder(accept_header)
    return PlainTextResponse(encoder(registry), media_type=content_type)


def instrument_app(app: FastAPI, service_name: str) -> None:
    app.middleware("http")(create_metrics_middleware(service_name))

    @app.get(METRICS_PATH, include_in_schema=False)
    async def metrics(request: Request) -> Response:
        return render_metrics(request.headers.get("accept", ""))
