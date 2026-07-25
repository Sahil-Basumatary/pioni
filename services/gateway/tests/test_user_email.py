import asyncio
import pytest
import gateway.user_email as user_email


@pytest.fixture(autouse=True)
def _reset():
    user_email.reset_email_cache()
    yield
    user_email.reset_email_cache()


@pytest.mark.asyncio
async def test_lookup_is_skipped_without_secret(monkeypatch):
    monkeypatch.setattr(user_email, "clerk_secret_key", lambda: None)
    calls: list[str] = []

    async def _fetch(clerk_id):
        calls.append(clerk_id)
        return "trader@pioni.ai"

    monkeypatch.setattr(user_email, "fetch_verified_email", _fetch)
    assert await user_email.resolve_email("u1") is None
    assert calls == []


@pytest.mark.asyncio
async def test_cold_resolve_awaits_and_caches(monkeypatch):
    monkeypatch.setattr(user_email, "clerk_secret_key", lambda: "sk_test")

    async def _fetch(clerk_id):
        return "trader@pioni.ai"

    monkeypatch.setattr(user_email, "fetch_verified_email", _fetch)
    assert await user_email.resolve_email("u1") == "trader@pioni.ai"
    assert user_email.cached_email("u1") == "trader@pioni.ai"


@pytest.mark.asyncio
async def test_hot_path_skips_clerk(monkeypatch):
    monkeypatch.setattr(user_email, "clerk_secret_key", lambda: "sk_test")
    calls: list[str] = []

    async def _fetch(clerk_id):
        calls.append(clerk_id)
        return "trader@pioni.ai"

    monkeypatch.setattr(user_email, "fetch_verified_email", _fetch)
    assert await user_email.resolve_email("u1") == "trader@pioni.ai"
    assert await user_email.resolve_email("u1") == "trader@pioni.ai"
    assert calls == ["u1"]


@pytest.mark.asyncio
async def test_unverified_account_is_negative_cached(monkeypatch):
    monkeypatch.setattr(user_email, "clerk_secret_key", lambda: "sk_test")
    calls: list[str] = []

    async def _fetch(clerk_id):
        calls.append(clerk_id)
        return None

    monkeypatch.setattr(user_email, "fetch_verified_email", _fetch)
    assert await user_email.resolve_email("u1") is None
    assert await user_email.resolve_email("u1") is None
    assert calls == ["u1"]


@pytest.mark.asyncio
async def test_concurrent_requests_share_one_lookup(monkeypatch):
    monkeypatch.setattr(user_email, "clerk_secret_key", lambda: "sk_test")
    calls: list[str] = []
    gate = asyncio.Event()

    async def _fetch(clerk_id):
        calls.append(clerk_id)
        await gate.wait()
        return "trader@pioni.ai"

    monkeypatch.setattr(user_email, "fetch_verified_email", _fetch)
    t1 = asyncio.create_task(user_email.resolve_email("u1"))
    t2 = asyncio.create_task(user_email.resolve_email("u1"))
    await asyncio.sleep(0)
    gate.set()
    assert await t1 == "trader@pioni.ai"
    assert await t2 == "trader@pioni.ai"
    assert calls == ["u1"]
