import logging
import os
from typing import Any

from common import publish_json

logger = logging.getLogger(__name__)

CHANNEL_SENTIMENT_UPDATED = "sentiment:updated:{ticker}"


async def publish_sentiment_update(payload: dict[str, Any]) -> None:
    if os.getenv("SENTIMENT_PUBLISH_ENABLED", "true").lower() != "true":
        return
    ticker = str(payload.get("ticker") or "").upper()
    if not ticker:
        return
    event = {
        "ticker": ticker,
        "asset_class": payload.get("asset_class"),
        "sentiment": payload.get("sentiment"),
        "confidence": payload.get("confidence"),
        "sources": payload.get("sources", {}),
        "computed_at": payload.get("computed_at"),
    }
    channel = CHANNEL_SENTIMENT_UPDATED.format(ticker=ticker)
    published = await publish_json(channel, event)
    if published:
        logger.info("published sentiment update", extra={"ticker": ticker, "channel": channel})

