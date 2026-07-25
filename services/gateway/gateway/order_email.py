from __future__ import annotations
import asyncio
import logging
import httpx
from gateway.settings import portfolio_service_url

logger = logging.getLogger(__name__)
_email_tasks: set[asyncio.Task] = set()


def _spawn(coro) -> None:
    task = asyncio.create_task(coro)
    _email_tasks.add(task)
    task.add_done_callback(_email_tasks.discard)


async def _post_order_email(portfolio_id: str, data: dict) -> None:
    status = str(data.get("status") or "").upper()
    if status not in {"FILLED", "PARTIALLY_FILLED", "REJECTED"}:
        return
    symbol = data.get("symbol")
    if not isinstance(symbol, str) or not symbol:
        return
    payload = {
        "portfolio_id": portfolio_id,
        "symbol": symbol,
        "status": status,
        "side": data.get("side") if isinstance(data.get("side"), str) else None,
    }
    try:
        async with httpx.AsyncClient(
            base_url=portfolio_service_url(), timeout=8.0,
        ) as client:
            await client.post("/internal/notify/order-email", json=payload)
    except Exception as e:
        logger.warning(
            "order email notify failed",
            extra={"error": str(e), "portfolio_id": portfolio_id},
        )


def schedule_order_email(portfolio_id: str, data: dict) -> None:
    _spawn(_post_order_email(portfolio_id, data))
