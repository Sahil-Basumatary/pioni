from __future__ import annotations
import logging
import os
from typing import Any
from fastapi import FastAPI

logger = logging.getLogger(__name__)

# Optional dependency: services run fine without OpenTelemetry installed. When the
# packages are missing the whole module degrades to no-ops so tracing is purely additive.
try:
    from opentelemetry import trace as _otel_trace
except ImportError:
    _otel_trace = None

_EXCLUDED_URLS = "/metrics,/health,/health/live,/health/ready"
_configured = False


def tracing_enabled() -> bool:
    return os.getenv("TRACING_ENABLED", "false").strip().lower() in {"1", "true", "yes"}


def _otlp_traces_endpoint() -> str:
    base = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4318").rstrip("/")
    return f"{base}/v1/traces"


def configure_tracing(service_name: str) -> bool:
    global _configured
    if _configured:
        return True
    if not tracing_enabled() or _otel_trace is None:
        return False
    try:
        from opentelemetry.sdk.resources import Resource
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import (
            OTLPSpanExporter,
        )
        from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
    except ImportError:
        logger.warning("TRACING_ENABLED set but opentelemetry packages are missing")
        return False
    provider = TracerProvider(resource=Resource.create({"service.name": service_name}))
    provider.add_span_processor(
        BatchSpanProcessor(OTLPSpanExporter(endpoint=_otlp_traces_endpoint()))
    )
    _otel_trace.set_tracer_provider(provider)
    # Outbound HTTP from the gateway carries the trace context downstream, which is
    # what turns five independent service spans into one distributed trace.
    HTTPXClientInstrumentor().instrument()
    _configured = True
    logger.info(
        "tracing configured", extra={"service": service_name, "exporter": "otlp-http"}
    )
    return True


def instrument_app_tracing(app: FastAPI, service_name: str) -> None:
    if not configure_tracing(service_name):
        return
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

    FastAPIInstrumentor.instrument_app(app, excluded_urls=_EXCLUDED_URLS)


def current_trace_ids() -> tuple[str, str] | None:
    if _otel_trace is None:
        return None
    span = _otel_trace.get_current_span()
    ctx = span.get_span_context()
    if not ctx or not ctx.is_valid:
        return None
    return format(ctx.trace_id, "032x"), format(ctx.span_id, "016x")


def tag_current_span(**attributes: Any) -> None:
    if _otel_trace is None:
        return
    span = _otel_trace.get_current_span()
    if not span.get_span_context().is_valid:
        return
    for key, value in attributes.items():
        span.set_attribute(key, value)
