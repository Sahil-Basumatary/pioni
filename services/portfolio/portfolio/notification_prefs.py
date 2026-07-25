from __future__ import annotations
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from common import (
    Portfolio as PortfolioORM,
    User as UserORM,
    UserNotificationPrefs as PrefsORM,
)
from portfolio.provisioning import Identity, get_or_create_user, is_placeholder_email

DEFAULTS = {
    "mode": "all",
    "toast_popups": True,
    "email_enabled": False,
    "browser_notifications": False,
    "fills": True,
    "partial_fills": True,
    "cancellations": True,
    "rejections": True,
    "placements": True,
}

ALLOWED_MODES = {"all", "important", "custom", "mute"}
EMAIL_STATUSES = {"FILLED", "PARTIALLY_FILLED", "REJECTED"}


async def _get_prefs(session: AsyncSession, user_id) -> PrefsORM | None:
    stmt = select(PrefsORM).where(PrefsORM.user_id == user_id)
    return (await session.execute(stmt)).scalar_one_or_none()


async def get_or_create_notification_prefs(
    session: AsyncSession, identity: Identity,
) -> PrefsORM:
    user = await get_or_create_user(session, identity)
    existing = await _get_prefs(session, user.id)
    if existing is not None:
        return existing
    row = PrefsORM(user_id=user.id, **DEFAULTS)
    session.add(row)
    try:
        await session.flush()
    except IntegrityError:
        await session.rollback()
        winner = await _get_prefs(session, user.id)
        if winner is None:
            raise
        return winner
    await session.refresh(row)
    return row


def apply_notification_prefs_patch(row: PrefsORM, patch: dict) -> PrefsORM:
    for key, value in patch.items():
        if value is None:
            continue
        if key == "mode" and value not in ALLOWED_MODES:
            continue
        if hasattr(row, key):
            setattr(row, key, value)
    return row


def should_email_status(status: str, prefs: PrefsORM) -> bool:
    if not prefs.email_enabled or prefs.mode == "mute":
        return False
    s = status.upper()
    if s not in EMAIL_STATUSES:
        return False
    if prefs.mode == "all" or prefs.mode == "important":
        return True
    if prefs.mode == "custom":
        if s == "FILLED":
            return prefs.fills
        if s == "PARTIALLY_FILLED":
            return prefs.partial_fills
        if s == "REJECTED":
            return prefs.rejections
    return False


async def resolve_order_email_context(
    session: AsyncSession, portfolio_id,
) -> tuple[str, PrefsORM] | None:
    stmt = (
        select(UserORM, PrefsORM)
        .join(PortfolioORM, PortfolioORM.user_id == UserORM.id)
        .outerjoin(PrefsORM, PrefsORM.user_id == UserORM.id)
        .where(PortfolioORM.id == portfolio_id)
    )
    row = (await session.execute(stmt)).first()
    if row is None:
        return None
    user, prefs = row
    if prefs is None:
        prefs = PrefsORM(user_id=user.id, **DEFAULTS)
        session.add(prefs)
        await session.flush()
        await session.refresh(prefs)
    if not user.email or is_placeholder_email(user.email):
        return None
    return user.email, prefs
