from __future__ import annotations
import hashlib
import secrets
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from common import PaperApiKey as PaperApiKeyORM
from portfolio.provisioning import Identity, get_or_create_user

KEY_PREFIX = "pk_paper_"
MAX_ACTIVE_KEYS = 10


def hash_api_key(raw_key: str) -> str:
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


def generate_api_key() -> tuple[str, str, str]:
    raw = f"{KEY_PREFIX}{secrets.token_hex(24)}"
    return raw, raw[:16], hash_api_key(raw)


async def list_active_api_keys(
    session: AsyncSession, identity: Identity,
) -> list[PaperApiKeyORM]:
    user = await get_or_create_user(session, identity)
    stmt = (
        select(PaperApiKeyORM)
        .where(
            PaperApiKeyORM.user_id == user.id,
            PaperApiKeyORM.revoked_at.is_(None),
        )
        .order_by(PaperApiKeyORM.created_at.desc())
    )
    return list((await session.execute(stmt)).scalars().all())


async def create_api_key(
    session: AsyncSession,
    identity: Identity,
    *,
    name: str,
    can_query: bool,
    can_trade: bool,
) -> tuple[PaperApiKeyORM, str]:
    user = await get_or_create_user(session, identity)
    active = await list_active_api_keys(session, identity)
    if len(active) >= MAX_ACTIVE_KEYS:
        raise ValueError("MAX_KEYS")
    cleaned = name.strip()
    if not cleaned:
        raise ValueError("NAME_REQUIRED")
    if not can_query and not can_trade:
        raise ValueError("SCOPE_REQUIRED")
    raw, prefix, key_hash = generate_api_key()
    row = PaperApiKeyORM(
        user_id=user.id,
        name=cleaned[:100],
        key_prefix=prefix,
        key_hash=key_hash,
        can_query=can_query,
        can_trade=can_trade,
    )
    session.add(row)
    await session.flush()
    await session.refresh(row)
    return row, raw


async def revoke_api_key(
    session: AsyncSession, identity: Identity, key_id,
) -> PaperApiKeyORM | None:
    user = await get_or_create_user(session, identity)
    stmt = select(PaperApiKeyORM).where(
        PaperApiKeyORM.id == key_id,
        PaperApiKeyORM.user_id == user.id,
        PaperApiKeyORM.revoked_at.is_(None),
    )
    row = (await session.execute(stmt)).scalar_one_or_none()
    if row is None:
        return None
    row.revoked_at = datetime.now(timezone.utc)
    await session.flush()
    await session.refresh(row)
    return row
