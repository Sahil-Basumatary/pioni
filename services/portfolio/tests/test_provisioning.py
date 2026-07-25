from __future__ import annotations
import uuid
from decimal import Decimal
import pytest
from fastapi import HTTPException
from common import Portfolio as PortfolioORM
from common import User as UserORM
from sqlalchemy.exc import IntegrityError
from portfolio.provisioning import (
    Identity,
    _fallback_email,
    get_or_create_portfolio,
    get_or_create_user,
    is_placeholder_email,
)
from portfolio.routes import current_identity


class _Result:
    def __init__(self, value):
        self._value = value

    def scalar_one_or_none(self):
        return self._value


class _Nested:
    def __init__(self, error):
        self._error = error

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        if self._error is not None:
            raise self._error
        return False


class _FakeSession:
    def __init__(self, results, nested_error=None):
        self._results = list(results)
        self._nested_error = nested_error
        self.added: list = []
        self.refreshed: list = []

    async def execute(self, stmt):
        return _Result(self._results.pop(0))

    def add(self, obj):
        self.added.append(obj)

    async def flush(self):
        for obj in self.added:
            if getattr(obj, "id", None) is None:
                obj.id = uuid.uuid4()

    async def refresh(self, obj):
        self.refreshed.append(obj)

    async def rollback(self):
        pass

    def begin_nested(self):
        return _Nested(self._nested_error)


IDENTITY = Identity(clerk_id="user_abc", email="trader@pioni.ai", username="trader")


async def test_creates_user_and_portfolio_for_new_identity():
    session = _FakeSession(results=[None, None])
    portfolio = await get_or_create_portfolio(session, IDENTITY, Decimal("100000"))
    users = [o for o in session.added if isinstance(o, UserORM)]
    portfolios = [o for o in session.added if isinstance(o, PortfolioORM)]
    assert len(users) == 1
    assert users[0].clerk_id == "user_abc"
    assert users[0].email == "trader@pioni.ai"
    assert len(portfolios) == 1
    assert portfolio.user_id == users[0].id
    assert portfolio.initial_balance == Decimal("100000")
    assert portfolio.cash_balance == Decimal("100000")
    assert portfolio in session.refreshed


async def test_returns_existing_portfolio_without_creating():
    user = UserORM(clerk_id="user_abc", email="trader@pioni.ai", username="trader")
    user.id = uuid.uuid4()
    existing = PortfolioORM(
        user_id=user.id,
        name="Main",
        initial_balance=Decimal("100000"),
        cash_balance=Decimal("42000"),
    )
    existing.id = uuid.uuid4()
    session = _FakeSession(results=[user, existing])
    portfolio = await get_or_create_portfolio(session, IDENTITY, Decimal("100000"))
    assert portfolio is existing
    assert session.added == []


async def test_existing_user_gets_new_portfolio():
    user = UserORM(clerk_id="user_abc", email="trader@pioni.ai", username="trader")
    user.id = uuid.uuid4()
    session = _FakeSession(results=[user, None])
    portfolio = await get_or_create_portfolio(session, IDENTITY, Decimal("100000"))
    assert portfolio.user_id == user.id
    assert [o for o in session.added if isinstance(o, UserORM)] == []


async def test_missing_email_uses_deterministic_fallback():
    session = _FakeSession(results=[None, None])
    identity = Identity(clerk_id="user_xyz")
    await get_or_create_portfolio(session, identity, Decimal("100000"))
    user = next(o for o in session.added if isinstance(o, UserORM))
    assert user.email == "user_xyz@users.pioni.local"
    assert user.username == "user_xyz"


def test_fallback_email_is_deterministic():
    assert _fallback_email("user_x") == "user_x@users.pioni.local"


def test_placeholder_email_detection():
    assert is_placeholder_email("user_x@users.pioni.local") is True
    assert is_placeholder_email("trader@pioni.ai") is False
    assert is_placeholder_email(None) is False


async def test_placeholder_email_is_replaced_once_clerk_resolves_it():
    user = UserORM(
        clerk_id="user_abc",
        email="user_abc@users.pioni.local",
        username="user_abc",
    )
    user.id = uuid.uuid4()
    session = _FakeSession(results=[user])
    synced = await get_or_create_user(session, IDENTITY)
    assert synced.email == "trader@pioni.ai"
    assert synced.username == "trader"
    assert session.added == []


async def test_identity_sync_keeps_stored_values_on_conflict():
    user = UserORM(
        clerk_id="user_abc",
        email="user_abc@users.pioni.local",
        username="user_abc",
    )
    user.id = uuid.uuid4()
    session = _FakeSession(
        results=[user],
        nested_error=IntegrityError("stmt", {}, Exception("duplicate")),
    )
    synced = await get_or_create_user(session, IDENTITY)
    assert synced.email == "user_abc@users.pioni.local"
    assert synced.username == "user_abc"


async def test_identity_sync_is_a_no_op_when_unchanged():
    user = UserORM(clerk_id="user_abc", email="trader@pioni.ai", username="trader")
    user.id = uuid.uuid4()
    session = _FakeSession(results=[user], nested_error=AssertionError("no write"))
    synced = await get_or_create_user(session, IDENTITY)
    assert synced is user


def test_identity_requires_clerk_id():
    with pytest.raises(HTTPException) as exc:
        current_identity(x_clerk_id=None, x_user_email=None, x_user_name=None)
    assert exc.value.status_code == 401


def test_identity_built_from_headers():
    identity = current_identity(
        x_clerk_id="u1", x_user_email="e@x.com", x_user_name="name",
    )
    assert identity.clerk_id == "u1"
    assert identity.email == "e@x.com"
    assert identity.username == "name"
