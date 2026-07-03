import pytest
import gateway.clerk_backend as clerk_backend


class _Resp:
    def __init__(self, status_code):
        self.status_code = status_code


class _FakeClient:
    def __init__(self, status_code):
        self._status = status_code
        self.calls: list = []

    async def patch(self, url, json=None):
        self.calls.append((url, json))
        return _Resp(self._status)


@pytest.fixture(autouse=True)
def _reset_client():
    clerk_backend._client = None
    yield
    clerk_backend._client = None


@pytest.mark.asyncio
async def test_no_secret_skips_write(monkeypatch):
    monkeypatch.setattr(clerk_backend, "clerk_secret_key", lambda: None)
    assert await clerk_backend.set_portfolio_metadata("u1", "p1") is False


@pytest.mark.asyncio
async def test_write_sends_public_metadata(monkeypatch):
    monkeypatch.setattr(clerk_backend, "clerk_secret_key", lambda: "sk_test")
    fake = _FakeClient(200)

    async def _get():
        return fake

    monkeypatch.setattr(clerk_backend, "_get_client", _get)
    ok = await clerk_backend.set_portfolio_metadata("u1", "p1")
    assert ok is True
    url, body = fake.calls[0]
    assert url == "/users/u1/metadata"
    assert body == {"public_metadata": {"portfolio_id": "p1"}}


@pytest.mark.asyncio
async def test_rejected_write_returns_false(monkeypatch):
    monkeypatch.setattr(clerk_backend, "clerk_secret_key", lambda: "sk_test")
    fake = _FakeClient(422)

    async def _get():
        return fake

    monkeypatch.setattr(clerk_backend, "_get_client", _get)
    assert await clerk_backend.set_portfolio_metadata("u1", "p1") is False
