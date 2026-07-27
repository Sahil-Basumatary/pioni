from __future__ import annotations
import re
import uuid
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from fastapi import HTTPException
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from common import (
    PriceAlert as PriceAlertORM,
    PriceAlertCondition,
    PriceAlertStatus,
)
from portfolio.provisioning import Identity, get_or_create_user

_SYMBOL_RE = re.compile(r"^[A-Z0-9]{2,20}$")
_MAX_ACTIVE = 50


def normalize_symbol(raw: str) -> str:
    symbol = raw.strip().upper().replace("/", "").replace("-", "")
    if symbol.endswith("USD") and not symbol.endswith(("USDT", "USDC")):
        symbol = f"{symbol[:-3]}USDT"
    return symbol


def parse_price(raw: str | Decimal) -> Decimal:
    try:
        price = raw if isinstance(raw, Decimal) else Decimal(str(raw).strip())
    except (InvalidOperation, ValueError) as exc:
        raise HTTPException(
            status_code=400,
            detail={"error": "INVALID_PRICE", "message": "price must be a number"},
        ) from exc
    if price <= 0:
        raise HTTPException(
            status_code=400,
            detail={"error": "INVALID_PRICE", "message": "price must be positive"},
        )
    return price.quantize(Decimal("0.00000001"))


def condition_met(
    condition: PriceAlertCondition, target: Decimal, price: Decimal,
) -> bool:
    if condition == PriceAlertCondition.ABOVE:
        return price >= target
    return price <= target


async def list_price_alerts(
    session: AsyncSession,
    identity: Identity,
    *,
    tab: str = "active",
    symbol: str | None = None,
) -> list[PriceAlertORM]:
    user = await get_or_create_user(session, identity)
    stmt = select(PriceAlertORM).where(PriceAlertORM.user_id == user.id)
    if tab == "history":
        stmt = stmt.where(
            or_(
                PriceAlertORM.status == PriceAlertStatus.TRIGGERED,
                PriceAlertORM.status == PriceAlertStatus.CANCELLED,
            ),
        )
    else:
        stmt = stmt.where(PriceAlertORM.status == PriceAlertStatus.ACTIVE)
    if symbol:
        stmt = stmt.where(PriceAlertORM.symbol == normalize_symbol(symbol))
    stmt = stmt.order_by(PriceAlertORM.created_at.desc()).limit(200)
    return list((await session.execute(stmt)).scalars().all())


async def create_price_alert(
    session: AsyncSession,
    identity: Identity,
    *,
    symbol: str,
    condition: str,
    target_price: str | Decimal,
) -> PriceAlertORM:
    user = await get_or_create_user(session, identity)
    normalized = normalize_symbol(symbol)
    if not _SYMBOL_RE.match(normalized):
        raise HTTPException(
            status_code=400,
            detail={"error": "INVALID_SYMBOL", "message": "symbol is invalid"},
        )
    try:
        cond = PriceAlertCondition(condition.upper())
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail={"error": "INVALID_CONDITION", "message": "condition must be ABOVE or BELOW"},
        ) from exc
    price = parse_price(target_price)
    active_count = len(
        (
            await session.execute(
                select(PriceAlertORM.id).where(
                    PriceAlertORM.user_id == user.id,
                    PriceAlertORM.status == PriceAlertStatus.ACTIVE,
                ),
            )
        ).all(),
    )
    if active_count >= _MAX_ACTIVE:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "ALERT_LIMIT",
                "message": f"at most {_MAX_ACTIVE} active alerts",
            },
        )
    row = PriceAlertORM(
        user_id=user.id,
        symbol=normalized,
        condition=cond,
        target_price=price,
        status=PriceAlertStatus.ACTIVE,
    )
    session.add(row)
    await session.commit()
    await session.refresh(row)
    return row


async def cancel_price_alert(
    session: AsyncSession, identity: Identity, alert_id: uuid.UUID,
) -> PriceAlertORM:
    user = await get_or_create_user(session, identity)
    row = await session.get(PriceAlertORM, alert_id)
    if row is None or row.user_id != user.id:
        raise HTTPException(
            status_code=404,
            detail={"error": "NOT_FOUND", "message": "alert not found"},
        )
    if row.status != PriceAlertStatus.ACTIVE:
        raise HTTPException(
            status_code=409,
            detail={"error": "NOT_ACTIVE", "message": "alert is not active"},
        )
    row.status = PriceAlertStatus.CANCELLED
    row.cancelled_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(row)
    return row


async def trigger_price_alert(
    session: AsyncSession,
    identity: Identity,
    alert_id: uuid.UUID,
    *,
    price: str | Decimal,
) -> PriceAlertORM:
    user = await get_or_create_user(session, identity)
    row = await session.get(PriceAlertORM, alert_id)
    if row is None or row.user_id != user.id:
        raise HTTPException(
            status_code=404,
            detail={"error": "NOT_FOUND", "message": "alert not found"},
        )
    if row.status == PriceAlertStatus.TRIGGERED:
        return row
    if row.status != PriceAlertStatus.ACTIVE:
        raise HTTPException(
            status_code=409,
            detail={"error": "NOT_ACTIVE", "message": "alert is not active"},
        )
    observed = parse_price(price)
    if not condition_met(row.condition, row.target_price, observed):
        raise HTTPException(
            status_code=409,
            detail={
                "error": "CONDITION_NOT_MET",
                "message": "price does not meet alert condition",
            },
        )
    row.status = PriceAlertStatus.TRIGGERED
    row.triggered_at = datetime.now(timezone.utc)
    row.trigger_price = observed
    await session.commit()
    await session.refresh(row)
    return row
