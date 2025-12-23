import random
from typing import Dict, List


async def get_feed(ticker: str):
    ticker = ticker.upper()
    items: List[Dict] = []

    for i in range(3):
        minutes_ago = (i + 1) * 45
        ago_str = f"{minutes_ago} min ago" if minutes_ago < 180 else f"{minutes_ago // 60} h ago"
        items.append(
            {
                "id": f"news-{i}",
                "type": "news",
                "title": f"{ticker} mock news headline {i + 1}",
                "source": "Mock Newswire",
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
                "source": "r/mockstocks",
                "score": round(random.uniform(-1, 1), 2),
                "ago": ago_str,
            }
        )

    if ticker == "NONEWS":
        items = [i for i in items if i["type"] == "reddit"]
    elif ticker == "NORED":
        items = [i for i in items if i["type"] == "news"]
    elif ticker == "TOOFEW":
        items = items[:1]
    elif ticker == "ZEROSENT":
        for i in items:
            i["score"] = 0.0

    return {"ticker": ticker, "items": items}