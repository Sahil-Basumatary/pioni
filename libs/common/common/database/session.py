from __future__ import annotations
import os
from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def get_engine(url: str | None = None, echo: bool = False) -> AsyncEngine:
    global _engine
    if _engine is not None:
        return _engine
    db_url = url or os.getenv("DATABASE_URL")
    if not db_url:
        raise RuntimeError("DATABASE_URL is not set")
    _engine = create_async_engine(db_url, echo=echo, pool_size=5, max_overflow=10)
    return _engine


def get_session_factory(
    url: str | None = None, echo: bool = False,
) -> async_sessionmaker[AsyncSession]:
    global _session_factory
    if _session_factory is not None:
        return _session_factory
    engine = get_engine(url, echo)
    _session_factory = async_sessionmaker(engine, expire_on_commit=False)
    return _session_factory


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    factory = get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def dispose_engine() -> None:
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _session_factory = None
