from __future__ import annotations
import logging
import os
import httpx

logger = logging.getLogger(__name__)


def resend_api_key() -> str | None:
    key = os.getenv("RESEND_API_KEY", "").strip()
    return key or None


def resend_from_email() -> str:
    return os.getenv("RESEND_FROM_EMAIL", "Pioni <onboarding@resend.dev>").strip()


async def send_resend_email(*, to: str, subject: str, text: str) -> bool:
    api_key = resend_api_key()
    if not api_key:
        logger.info("resend skipped — RESEND_API_KEY not set")
        return False
    payload = {
        "from": resend_from_email(),
        "to": [to],
        "subject": subject,
        "text": text,
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
        if resp.status_code >= 400:
            logger.warning(
                "resend failed",
                extra={"status": resp.status_code, "body": resp.text[:300]},
            )
            return False
        return True
    except Exception:
        logger.exception("resend request error")
        return False


def order_email_copy(*, symbol: str, side: str | None, status: str) -> tuple[str, str]:
    pretty = status.replace("_", " ").title()
    side_bit = f"{side} " if side else ""
    subject = f"Pioni · {symbol} {pretty}"
    text = (
        f"Your paper {side_bit}order for {symbol} is now {pretty}.\n\n"
        f"This is a simulated paper-trading alert from Pioni.\n"
    )
    return subject, text
