from __future__ import annotations
import logging
import httpx
from gateway.settings import clerk_secret_key

logger = logging.getLogger(__name__)

_CLERK_API_BASE = "https://api.clerk.com/v1"
_client: httpx.AsyncClient | None = None


async def _get_client() -> httpx.AsyncClient | None:
    global _client
    secret = clerk_secret_key()
    if not secret:
        return None
    if _client is None:
        _client = httpx.AsyncClient(
            base_url=_CLERK_API_BASE,
            headers={"Authorization": f"Bearer {secret}"},
            timeout=5.0,
        )
    return _client


async def close_clerk_client() -> None:
    global _client
    if _client:
        await _client.aclose()
        _client = None


async def set_portfolio_metadata(clerk_id: str, portfolio_id: str) -> bool:
    # Best-effort: promoting the user into the zero-hop tier is an optimization, never a
    # correctness requirement, so a failed write is logged and swallowed rather than surfaced.
    client = await _get_client()
    if client is None:
        return False
    try:
        resp = await client.patch(
            f"/users/{clerk_id}/metadata",
            json={"public_metadata": {"portfolio_id": portfolio_id}},
        )
    except httpx.RequestError as e:
        logger.warning("clerk metadata write unreachable", extra={"error": str(e)})
        return False
    if resp.status_code >= 400:
        logger.warning(
            "clerk metadata write rejected",
            extra={"status": resp.status_code, "clerk_id": clerk_id},
        )
        return False
    return True
