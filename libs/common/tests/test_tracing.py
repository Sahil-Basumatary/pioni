from __future__ import annotations
import pytest
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter
from common.tracing import (
    tracing_enabled,
    configure_tracing,
    current_trace_ids,
    tag_current_span,
)


@pytest.fixture(scope="module")
def tracer():
    provider = TracerProvider()
    exporter = InMemorySpanExporter()
    provider.add_span_processor(SimpleSpanProcessor(exporter))
    trace.set_tracer_provider(provider)
    return trace.get_tracer("test"), exporter


def test_tracing_disabled_by_default(monkeypatch):
    monkeypatch.delenv("TRACING_ENABLED", raising=False)
    assert tracing_enabled() is False


@pytest.mark.parametrize(
    "value,expected",
    [("true", True), ("1", True), ("YES", True), ("false", False), ("", False)],
)
def test_tracing_enabled_parsing(monkeypatch, value, expected):
    monkeypatch.setenv("TRACING_ENABLED", value)
    assert tracing_enabled() is expected


def test_configure_tracing_is_noop_when_disabled(monkeypatch):
    monkeypatch.setenv("TRACING_ENABLED", "false")
    assert configure_tracing("test-svc") is False


def test_current_trace_ids_none_outside_span(tracer):
    assert current_trace_ids() is None


def test_current_trace_ids_within_span(tracer):
    tracer_obj, _ = tracer
    with tracer_obj.start_as_current_span("unit"):
        ids = current_trace_ids()
    assert ids is not None
    trace_id, span_id = ids
    assert len(trace_id) == 32
    assert len(span_id) == 16


def test_tag_current_span_records_attribute(tracer):
    tracer_obj, exporter = tracer
    exporter.clear()
    with tracer_obj.start_as_current_span("tagged"):
        tag_current_span(**{"request.id": "abc123"})
    spans = exporter.get_finished_spans()
    assert any(s.attributes.get("request.id") == "abc123" for s in spans)


def test_tag_current_span_safe_without_active_span():
    tag_current_span(**{"request.id": "noop"})
