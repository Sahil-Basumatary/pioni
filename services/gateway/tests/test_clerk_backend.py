import pytest
import gateway.clerk_backend as clerk_backend


class _Resp:
    def __init__(self, status_code, payload=None):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        return self._payload


class _FakeClient:
    def __init__(self, status_code, payload=None):
        self._status = status_code
        self._payload = payload
        self.calls: list = []

    async def patch(self, url, json=None):
        self.calls.append((url, json))
        return _Resp(self._status)

    async def get(self, url):
        self.calls.append((url, None))
        return _Resp(self._status, self._payload)


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


def test_primary_verified_email_wins():
    payload = {
        "primary_email_address_id": "idn_1",
        "email_addresses": [
            {
                "id": "idn_2",
                "email_address": "old@pioni.ai",
                "verification": {"status": "verified"},
            },
            {
                "id": "idn_1",
                "email_address": "trader@pioni.ai",
                "verification": {"status": "verified"},
            },
        ],
    }
    assert clerk_backend._verified_email(payload) == "trader@pioni.ai"


def test_unverified_primary_falls_back_to_a_verified_address():
    payload = {
        "primary_email_address_id": "idn_1",
        "email_addresses": [
            {
                "id": "idn_1",
                "email_address": "pending@pioni.ai",
                "verification": {"status": "unverified"},
            },
            {
                "id": "idn_2",
                "email_address": "trader@pioni.ai",
                "verification": {"status": "verified"},
            },
        ],
    }
    assert clerk_backend._verified_email(payload) == "trader@pioni.ai"


def test_no_verified_address_returns_none():
    payload = {
        "primary_email_address_id": "idn_1",
        "email_addresses": [
            {
                "id": "idn_1",
                "email_address": "pending@pioni.ai",
                "verification": {"status": "unverified"},
            },
        ],
    }
    assert clerk_backend._verified_email(payload) is None


@pytest.mark.asyncio
async def test_fetch_verified_email_reads_clerk_user(monkeypatch):
    monkeypatch.setattr(clerk_backend, "clerk_secret_key", lambda: "sk_test")
    fake = _FakeClient(
        200,
        {
            "primary_email_address_id": "idn_1",
            "email_addresses": [
                {
                    "id": "idn_1",
                    "email_address": "trader@pioni.ai",
                    "verification": {"status": "verified"},
                },
            ],
        },
    )

    async def _get():
        return fake

    monkeypatch.setattr(clerk_backend, "_get_client", _get)
    assert await clerk_backend.fetch_verified_email("u1") == "trader@pioni.ai"
    assert fake.calls[0][0] == "/users/u1"


@pytest.mark.asyncio
async def test_fetch_verified_email_without_secret(monkeypatch):
    monkeypatch.setattr(clerk_backend, "clerk_secret_key", lambda: None)
    assert await clerk_backend.fetch_verified_email("u1") is None
