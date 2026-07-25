from __future__ import annotations
import logging
import uuid
from dataclasses import dataclass
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from common import Portfolio as PortfolioORM
from common import User as UserORM

logger = logging.getLogger(__name__)

DEFAULT_PORTFOLIO_NAME = "Main"


@dataclass(frozen=True)
class Identity:
    clerk_id: str
    email: str | None = None
    username: str | None = None


PLACEHOLDER_EMAIL_DOMAIN = "users.pioni.local"


def _fallback_email(clerk_id: str) -> str:
    # Clerk's default session token carries only the user id. Until the token (or a Clerk
    # webhook) supplies a real email we store a deterministic placeholder that satisfies the
    # NOT NULL/unique contract and can be overwritten in place by a later sync.
    return f"{clerk_id}@{PLACEHOLDER_EMAIL_DOMAIN}"


def is_placeholder_email(email: str | None) -> bool:
    return bool(email) and email.endswith(f"@{PLACEHOLDER_EMAIL_DOMAIN}")


async def _get_user(session: AsyncSession, clerk_id: str) -> UserORM | None:
    stmt = select(UserORM).where(UserORM.clerk_id == clerk_id)
    return (await session.execute(stmt)).scalar_one_or_none()


async def _get_default_portfolio(
    session: AsyncSession, user_id: uuid.UUID,
) -> PortfolioORM | None:
    stmt = (
        select(PortfolioORM)
        .where(PortfolioORM.user_id == user_id)
        .order_by(PortfolioORM.created_at)
        .limit(1)
    )
    return (await session.execute(stmt)).scalar_one_or_none()


async def _sync_identity(
    session: AsyncSession, user: UserORM, identity: Identity,
) -> UserORM:
    updates: dict[str, str] = {}
    if identity.email and identity.email != user.email:
        updates["email"] = identity.email
    if identity.username and identity.username != user.username:
        updates["username"] = identity.username
    if not updates:
        return user
    previous = {field: getattr(user, field) for field in updates}
    try:
        # A nested transaction keeps a unique-constraint clash (same address already claimed by
        # another account) from poisoning the caller's transaction.
        async with session.begin_nested():
            for field, value in updates.items():
                setattr(user, field, value)
    except IntegrityError:
        for field, value in previous.items():
            setattr(user, field, value)
        logger.warning(
            "identity sync rejected", extra={"clerk_id": identity.clerk_id},
        )
    return user


async def get_or_create_user(session: AsyncSession, identity: Identity) -> UserORM:
    existing = await _get_user(session, identity.clerk_id)
    if existing is not None:
        return await _sync_identity(session, existing, identity)
    user = UserORM(
        clerk_id=identity.clerk_id,
        email=identity.email or _fallback_email(identity.clerk_id),
        username=identity.username or identity.clerk_id,
    )
    session.add(user)
    try:
        await session.flush()
    except IntegrityError:
        # Two concurrent first-logins raced to insert the same clerk_id; the unique
        # constraint rejects the loser, so fall back to the row the winner committed.
        await session.rollback()
        winner = await _get_user(session, identity.clerk_id)
        if winner is None:
            raise
        return winner
    return user


async def get_or_create_portfolio(
    session: AsyncSession, identity: Identity, starting_balance: Decimal,
) -> PortfolioORM:
    user = await get_or_create_user(session, identity)
    existing = await _get_default_portfolio(session, user.id)
    if existing is not None:
        return existing
    portfolio = PortfolioORM(
        user_id=user.id,
        name=DEFAULT_PORTFOLIO_NAME,
        initial_balance=starting_balance,
        cash_balance=starting_balance,
    )
    session.add(portfolio)
    await session.flush()
    # Load DB-populated columns (server-default timestamps) so the response is complete.
    await session.refresh(portfolio)
    return portfolio
