from __future__ import annotations
import re
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from common import (
    UserMarketFavorites as FavoritesORM,
)
from portfolio.provisioning import Identity, get_or_create_user

MAX_FAVORITES = 50
_SYMBOL_RE = re.compile(r"^[A-Z0-9]{2,20}$")


def normalize_symbols(raw: list | None) -> list[str]:
    if not raw:
        return []
    seen: set[str] = set()
    out: list[str] = []
    for item in raw:
        if not isinstance(item, str):
            continue
        symbol = item.strip().upper()
        if not _SYMBOL_RE.fullmatch(symbol) or symbol in seen:
            continue
        seen.add(symbol)
        out.append(symbol)
        if len(out) >= MAX_FAVORITES:
            break
    return out


async def _get_favorites(session: AsyncSession, user_id) -> FavoritesORM | None:
    stmt = select(FavoritesORM).where(FavoritesORM.user_id == user_id)
    return (await session.execute(stmt)).scalar_one_or_none()


async def get_or_create_market_favorites(
    session: AsyncSession, identity: Identity,
) -> FavoritesORM:
    user = await get_or_create_user(session, identity)
    existing = await _get_favorites(session, user.id)
    if existing is not None:
        existing.symbols = normalize_symbols(existing.symbols)
        return existing
    row = FavoritesORM(user_id=user.id, symbols=[])
    session.add(row)
    try:
        await session.flush()
    except IntegrityError:
        await session.rollback()
        winner = await _get_favorites(session, user.id)
        if winner is None:
            raise
        winner.symbols = normalize_symbols(winner.symbols)
        return winner
    await session.refresh(row)
    return row


async def set_market_favorites(
    session: AsyncSession,
    identity: Identity,
    symbols: list[str],
) -> FavoritesORM:
    row = await get_or_create_market_favorites(session, identity)
    row.symbols = normalize_symbols(symbols)
    await session.flush()
    await session.refresh(row)
    return row
