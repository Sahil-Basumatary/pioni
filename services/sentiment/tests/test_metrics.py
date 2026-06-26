from fastapi.testclient import TestClient

from sentiment.main import app

client = TestClient(app, raise_server_exceptions=False)


def test_metrics_endpoint_exposes_prometheus_format():
    resp = client.get("/metrics")

    assert resp.status_code == 200
    assert "text/plain" in resp.headers["content-type"]
    assert "http_request_duration_seconds" in resp.text


def test_metrics_record_requests_with_route_template():
    client.get("/health")
    resp = client.get("/metrics")

    assert 'http_requests_total{' in resp.text
    assert 'service="sentiment"' in resp.text
    assert 'path="/health"' in resp.text


def test_metrics_merge_from_multiproc_dir(tmp_path, monkeypatch):
    monkeypatch.setenv("PROMETHEUS_MULTIPROC_DIR", str(tmp_path))

    resp = client.get("/metrics")

    assert resp.status_code == 200
    assert "text/plain" in resp.headers["content-type"]
