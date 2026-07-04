from __future__ import annotations
from common.metrics import (
    HTTP_REQUEST_DURATION_SECONDS,
    render_metrics,
    trace_exemplar,
)

OPENMETRICS = "application/openmetrics-text"


def test_trace_exemplar_none_outside_span(monkeypatch):
    monkeypatch.delenv("PROMETHEUS_MULTIPROC_DIR", raising=False)
    assert trace_exemplar() is None


def test_trace_exemplar_carries_trace_id_within_span(otel, monkeypatch):
    monkeypatch.delenv("PROMETHEUS_MULTIPROC_DIR", raising=False)
    tracer_obj, _ = otel
    with tracer_obj.start_as_current_span("obs"):
        exemplar = trace_exemplar()
    assert exemplar is not None
    assert len(exemplar["trace_id"]) == 32


def test_trace_exemplar_disabled_under_multiprocess(otel, monkeypatch, tmp_path):
    monkeypatch.setenv("PROMETHEUS_MULTIPROC_DIR", str(tmp_path))
    tracer_obj, _ = otel
    with tracer_obj.start_as_current_span("obs"):
        assert trace_exemplar() is None


def test_render_metrics_emits_exemplar_in_openmetrics(otel, monkeypatch):
    monkeypatch.delenv("PROMETHEUS_MULTIPROC_DIR", raising=False)
    tracer_obj, _ = otel
    with tracer_obj.start_as_current_span("obs"):
        exemplar = trace_exemplar()
        HTTP_REQUEST_DURATION_SECONDS.labels(
            "exemplar-test", "GET", "/x"
        ).observe(0.01, exemplar=exemplar)
        trace_id = exemplar["trace_id"]
    resp = render_metrics(OPENMETRICS)
    assert "openmetrics" in resp.media_type
    assert trace_id in resp.body.decode()


def test_render_metrics_defaults_to_plain_text():
    resp = render_metrics("*/*")
    assert "text/plain" in resp.media_type
