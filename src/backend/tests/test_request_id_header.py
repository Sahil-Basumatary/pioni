import importlib
from fastapi.testclient import TestClient

def test_x_request_id_header_present():
    import backend.main as main_mod
    importlib.reload(main_mod)

    client = TestClient(main_mod.app)
    r = client.get("/health")
    assert r.status_code == 200
    assert r.headers.get("x-request-id")  