import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple, Optional
from fastapi import Request
from newsapi import NewsApiClient
import praw
from backend.settings import is_mock_mode
from backend.services.scoring import vader_score

def _ago(ts: Optional[datetime]) -> str:
    if not ts:
        return ""
    now = datetime.now(timezone.utc)
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    mins = int((now - ts).total_seconds() // 60)
    if mins < 60:
        return f"{mins} min ago"
    hrs = mins // 60
    return f"{hrs} h ago"


async def get_feed(ticker: str, request: Request) -> Tuple[Dict[str, Any], str]:
    ticker = ticker.upper()
    if is_mock_mode():
        import random

        items: List[Dict[str, Any]] = []

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

        return {"ticker": ticker, "items": items}, "MOCK"

    items: List[Dict[str, Any]] = []

    api_key = os.getenv("NEWS_API_KEY")
    if api_key:
        try:
            newsapi = NewsApiClient(api_key=api_key)
            query = f'{ticker} stock OR shares OR earnings'
            res = newsapi.get_everything(q=query, language="en", page_size=10)
            articles = res.get("articles") or []

            for idx, a in enumerate(articles):
                title = a.get("title")
                if not title:
                    continue

                source_name = (a.get("source") or {}).get("name") or "News"
                published_at = a.get("publishedAt")
                dt = None
                if published_at:
                    try:
                        dt = datetime.fromisoformat(published_at.replace("Z", "+00:00")).astimezone(timezone.utc)
                    except Exception:
                        dt = None

                items.append(
                    {
                        "id": f"news-{idx}",
                        "type": "news",
                        "title": title,
                        "source": source_name,
                        "score": round(float(vader_score(title)), 2),
                        "ago": _ago(dt),
                    }
                )
        except Exception:
            pass

    client_id = os.getenv("REDDIT_CLIENT_ID")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET")
    if client_id and client_secret:
        try:
            reddit = praw.Reddit(
                client_id=client_id,
                client_secret=client_secret,
                user_agent="pioni_by_u/AquaBzy",
            )

            subs = ["stocks", "wallstreetbets", "investing"]
            seen = set()

            for sub in subs:
                posts = reddit.subreddit(sub).search(query=ticker, sort="new", limit=5)
                for p in posts:
                    title = getattr(p, "title", None)
                    if not title:
                        continue
                    if title in seen:
                        continue
                    seen.add(title)

                    created = getattr(p, "created_utc", None)
                    dt = datetime.fromtimestamp(created, tz=timezone.utc) if created else None

                    items.append(
                        {
                            "id": f"reddit-{sub}-{len(seen)}",
                            "type": "reddit",
                            "title": title,
                            "source": f"r/{sub}",
                            "score": round(float(vader_score(title)), 2),
                            "ago": _ago(dt),
                        }
                    )
        except Exception:
            pass

    def _sort_key(x: Dict[str, Any]) -> int:
        ago = x.get("ago") or ""
        if "min" in ago:
            return int(ago.split(" ")[0])
        if "h" in ago:
            return int(ago.split(" ")[0]) * 60
        return 10**9

    items.sort(key=_sort_key)

    return {"ticker": ticker, "items": items[:12]}, "MISS"