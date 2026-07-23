from __future__ import annotations
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from common import UserOnboarding as UserOnboardingORM
from portfolio.provisioning import Identity, get_or_create_user

CHECKLIST_FLAGS = (
    "checklist_tour",
    "checklist_first_trade",
    "checklist_view_position",
    "checklist_sentiment",
    "checklist_limit_order",
)


async def _get_onboarding(
    session: AsyncSession, user_id,
) -> UserOnboardingORM | None:
    stmt = select(UserOnboardingORM).where(UserOnboardingORM.user_id == user_id)
    return (await session.execute(stmt)).scalar_one_or_none()


async def get_or_create_onboarding(
    session: AsyncSession, identity: Identity,
) -> UserOnboardingORM:
    user = await get_or_create_user(session, identity)
    existing = await _get_onboarding(session, user.id)
    if existing is not None:
        return existing
    row = UserOnboardingORM(
        user_id=user.id,
        welcome_seen=False,
        tour_completed=False,
        tour_skipped=False,
        checklist_tour=False,
        checklist_first_trade=False,
        checklist_view_position=False,
        checklist_sentiment=False,
        checklist_limit_order=False,
    )
    session.add(row)
    try:
        await session.flush()
    except IntegrityError:
        await session.rollback()
        winner = await _get_onboarding(session, user.id)
        if winner is None:
            raise
        return winner
    await session.refresh(row)
    return row


def _all_checklist_done(row: UserOnboardingORM) -> bool:
    return all(getattr(row, flag) for flag in CHECKLIST_FLAGS)


def apply_onboarding_patch(row: UserOnboardingORM, patch: dict) -> UserOnboardingORM:
    now = datetime.now(timezone.utc)
    for key, value in patch.items():
        if value is None:
            continue
        setattr(row, key, value)
    if patch.get("tour_completed") is True:
        row.tour_completed_at = row.tour_completed_at or now
        row.welcome_seen = True
        row.checklist_tour = True
    if patch.get("tour_skipped") is True:
        row.tour_skipped_at = row.tour_skipped_at or now
        row.welcome_seen = True
    if patch.get("welcome_seen") is True:
        row.welcome_seen = True
    if _all_checklist_done(row) and row.checklist_completed_at is None:
        row.checklist_completed_at = now
    return row
