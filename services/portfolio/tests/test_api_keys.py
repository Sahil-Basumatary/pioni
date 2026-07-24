from __future__ import annotations
import uuid
from common import PaperApiKey as PaperApiKeyORM
from common import User as UserORM
from portfolio.api_keys import (
    MAX_ACTIVE_KEYS,
    create_api_key,
    generate_api_key,
    hash_api_key,
    list_active_api_keys,
    revoke_api_key,
)
from portfolio.provisioning import Identity

IDENTITY = Identity(clerk_id="user_keys", email="keys@pioni.ai", username="keys")


class _Result:
    def __init__(self, value):
        self._value = value

    def scalar_one_or_none(self):
        return self._value


class _Scalars:
    def __init__(self, values):
        self._values = values

    def all(self):
        return list(self._values)


class _ListResult:
    def __init__(self, values):
        self._values = values

    def scalars(self):
        return _Scalars(self._values)


class _FakeSession:
    def __init__(self, results):
        self._results = list(results)
        self.added: list = []

    async def execute(self, stmt):
        value = self._results.pop(0)
        if isinstance(value, list):
            return _ListResult(value)
        return _Result(value)

    def add(self, obj):
        self.added.append(obj)

    async def flush(self):
        for obj in self.added:
            if getattr(obj, "id", None) is None:
                obj.id = uuid.uuid4()

    async def refresh(self, obj):
        return None


async def test_generate_api_key_shape():
    raw, prefix, digest = generate_api_key()
    assert raw.startswith("pk_paper_")
    assert prefix == raw[:16]
    assert digest == hash_api_key(raw)
    assert len(digest) == 64


async def test_create_and_list_api_key(monkeypatch):
    user = UserORM(
        id=uuid.uuid4(),
        clerk_id=IDENTITY.clerk_id,
        email=IDENTITY.email or "keys@pioni.ai",
        username=IDENTITY.username or "keys",
    )

    async def fake_user(session, identity):
        return user

    monkeypatch.setattr("portfolio.api_keys.get_or_create_user", fake_user)
    session = _FakeSession([[]])
    row, raw = await create_api_key(
        session,
        IDENTITY,
        name="Bot",
        can_query=True,
        can_trade=False,
    )
    assert raw.startswith("pk_paper_")
    assert row.name == "Bot"
    assert row.can_query is True
    assert row.can_trade is False
    assert row.key_hash == hash_api_key(raw)


async def test_list_active_api_keys(monkeypatch):
    user = UserORM(
        id=uuid.uuid4(),
        clerk_id=IDENTITY.clerk_id,
        email=IDENTITY.email or "keys@pioni.ai",
        username=IDENTITY.username or "keys",
    )
    key = PaperApiKeyORM(
        id=uuid.uuid4(),
        user_id=user.id,
        name="Reader",
        key_prefix="pk_paper_abcd",
        key_hash="a" * 64,
        can_query=True,
        can_trade=False,
    )

    async def fake_user(session, identity):
        return user

    monkeypatch.setattr("portfolio.api_keys.get_or_create_user", fake_user)
    session = _FakeSession([[key]])
    rows = await list_active_api_keys(session, IDENTITY)
    assert rows == [key]


async def test_revoke_api_key(monkeypatch):
    user = UserORM(
        id=uuid.uuid4(),
        clerk_id=IDENTITY.clerk_id,
        email=IDENTITY.email or "keys@pioni.ai",
        username=IDENTITY.username or "keys",
    )
    key_id = uuid.uuid4()
    key = PaperApiKeyORM(
        id=key_id,
        user_id=user.id,
        name="Trader",
        key_prefix="pk_paper_efgh",
        key_hash="b" * 64,
        can_query=True,
        can_trade=True,
        revoked_at=None,
    )

    async def fake_user(session, identity):
        return user

    monkeypatch.setattr("portfolio.api_keys.get_or_create_user", fake_user)
    session = _FakeSession([key])
    revoked = await revoke_api_key(session, IDENTITY, key_id)
    assert revoked is not None
    assert revoked.revoked_at is not None


async def test_max_keys_guard(monkeypatch):
    user = UserORM(
        id=uuid.uuid4(),
        clerk_id=IDENTITY.clerk_id,
        email=IDENTITY.email or "keys@pioni.ai",
        username=IDENTITY.username or "keys",
    )
    existing = [
        PaperApiKeyORM(
            id=uuid.uuid4(),
            user_id=user.id,
            name=f"k{i}",
            key_prefix="pk_paper_xxxx",
            key_hash=f"{i:064d}",
            can_query=True,
            can_trade=True,
        )
        for i in range(MAX_ACTIVE_KEYS)
    ]

    async def fake_user(session, identity):
        return user

    monkeypatch.setattr("portfolio.api_keys.get_or_create_user", fake_user)
    session = _FakeSession([existing])
    try:
        await create_api_key(
            session,
            IDENTITY,
            name="Overflow",
            can_query=True,
            can_trade=True,
        )
        raised = False
    except ValueError as err:
        raised = str(err) == "MAX_KEYS"
    assert raised
