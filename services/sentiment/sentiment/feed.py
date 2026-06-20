import os
import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple
from fastapi import Request
from sentiment.assets import resolve_asset
from sentiment.settings import is_mock_mode
from sentiment.scoring import score_items
from sentiment.sources import ago, fetch_news_items, fetch_reddit_items, fetch_x_items
from common import TTLCache

_feed_cache = TTLCache()
FEED_TTL_SECONDS = int(os.getenv("FEED_CACHE_TTL_SECONDS", "120"))
FEED_STALE_SECONDS = int(os.getenv("FEED_CACHE_STALE_SECONDS", "30"))


async def get_feed(ticker: str, request: Request) -> Tuple[Dict[str, Any], str]:
    asset = resolve_asset(ticker)
    ticker = asset.ticker
    if is_mock_mode():
        import random

        items: List[Dict[str, Any]] = []
        source_name = "Mock Crypto Wire" if asset.asset_class == "crypto" else "Mock Newswire"
        reddit_source = "r/CryptoCurrency" if asset.asset_class == "crypto" else "r/mockstocks"

        for i in range(3):
            minutes_ago = (i + 1) * 45
            ago_str = f"{minutes_ago} min ago" if minutes_ago < 180 else f"{minutes_ago // 60} h ago"
            items.append(
                {
                    "id": f"news-{i}",
                    "type": "news",
                    "title": f"{ticker} mock news headline {i + 1}",
                    "source": source_name,
                    "score": round(random.uniform(-1, 1), 2),
                    "ago": ago_str,
                }
            )

        for i in range(2):
            minutes_ago = (i + 4) * 30
            ago_str = f"{minutes_ago} min ago" if minutes_ago < 180 else f"{minutes_ago // 60} h ago"
            items.append(
                {
                    "id": f"reddit-{i}",
                    "type": "reddit",
                    "title": f"{ticker} mock Reddit thread {i + 1}",
                    "source": reddit_source,
                    "score": round(random.uniform(-1, 1), 2),
                    "ago": ago_str,
                }
            )

        return {"ticker": ticker, "asset_class": asset.asset_class, "items": items}, "MOCK"

    cache_key = f"feed:{ticker}"

    async def compute():
        results = await asyncio.gather(
            asyncio.to_thread(fetch_news_items, asset),
            asyncio.to_thread(fetch_reddit_items, asset),
            asyncio.to_thread(fetch_x_items, asset),
            return_exceptions=True,
        )
        raw_items = []
        for result in results:
            if not isinstance(result, Exception):
                raw_items.extend(result)
        scored = await score_items(raw_items, finbert_top_n=8)
        scored.sort(
            key=lambda item: item.ts or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True,
        )
        items = [
            {
                "id": item.item_id,
                "type": item.source,
                "title": item.text,
                "source": item.provider or item.source,
                "score": round(float(item.score), 2),
                "ago": ago(item.ts),
            }
            for item in scored[:12]
        ]
        return {"ticker": ticker, "asset_class": asset.asset_class, "items": items}
    payload, cache_status = await _feed_cache.get_or_compute_swr(
        cache_key,
        ttl_seconds=FEED_TTL_SECONDS,
        stale_seconds=FEED_STALE_SECONDS,
        compute=compute,
    )
    return payload, cache_status

