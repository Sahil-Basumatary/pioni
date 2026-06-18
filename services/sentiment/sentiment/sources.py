import hashlib
import logging
import os
from datetime import datetime, timezone
from typing import Any

import httpx
import praw
from newsapi import NewsApiClient

from sentiment.assets import AssetProfile

logger = logging.getLogger(__name__)

X_RECENT_SEARCH_URL = "https://api.twitter.com/2/tweets/search/recent"


def iso(dt: datetime | None) -> str | None:
    if not dt:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def ago(ts: datetime | None) -> str:
    if not ts:
        return ""
    now = datetime.now(timezone.utc)
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    mins = max(0, int((now - ts).total_seconds() // 60))
    if mins < 60:
        return f"{mins} min ago"
    hrs = mins // 60
    return f"{hrs} h ago"


def stable_id(prefix: str, raw: str) -> str:
    digest = hashlib.sha1(raw.encode("utf-8")).hexdigest()[:16]
    return f"{prefix}:{digest}"


def news_query(asset: AssetProfile) -> str:
    if asset.asset_class == "crypto":
        terms = " OR ".join(f'"{term}"' for term in asset.news_terms)
        return f"({terms}) AND (crypto OR blockchain OR token OR exchange OR ETF)"
    return " OR ".join(asset.news_terms)


def reddit_query(asset: AssetProfile) -> str:
    if asset.asset_class == "crypto":
        terms = " OR ".join(asset.aliases[:4])
        return f"{terms} crypto"
    return asset.ticker


def x_query(asset: AssetProfile) -> str:
    terms = " OR ".join(f'"{term}"' for term in asset.news_terms[:3])
    account_filter = " OR ".join(f"from:{account}" for account in asset.x_accounts)
    if account_filter:
        return f"({terms} OR {account_filter}) lang:en -is:retweet"
    return f"({terms}) lang:en -is:retweet"


def fetch_news_items(asset: AssetProfile) -> list[dict[str, Any]]:
    api_key = os.getenv("NEWS_API_KEY")
    if not api_key:
        logger.warning("NEWS_API_KEY missing; returning no news items", extra={"ticker": asset.ticker})
        return []
    newsapi = NewsApiClient(api_key=api_key)
    result = newsapi.get_everything(q=news_query(asset), language="en", page_size=20)
    items: list[dict[str, Any]] = []
    for article in result.get("articles") or []:
        title = article.get("title")
        if not title:
            continue
        url = article.get("url") or None
        published_at = article.get("publishedAt")
        dt = None
        if published_at:
            try:
                dt = datetime.fromisoformat(published_at.replace("Z", "+00:00")).astimezone(timezone.utc)
            except ValueError:
                dt = None
        raw = url or f"{title}|{published_at or ''}"
        items.append(
            {
                "source": "news",
                "provider": "newsapi",
                "id": stable_id("newsapi", raw),
                "url": url,
                "text": title,
                "ts": dt,
            }
        )
    return items


def fetch_reddit_items(asset: AssetProfile) -> list[dict[str, Any]]:
    client_id = os.getenv("REDDIT_CLIENT_ID")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET")
    if not client_id or not client_secret:
        logger.warning("Reddit credentials missing; returning no reddit items", extra={"ticker": asset.ticker})
        return []
    reddit = praw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        user_agent=os.getenv("REDDIT_USER_AGENT", "pioni_sentiment_service/0.4"),
    )
    items: list[dict[str, Any]] = []
    seen: set[str] = set()
    for subreddit in asset.reddit_subreddits:
        posts = reddit.subreddit(subreddit).search(query=reddit_query(asset), sort="new", limit=15)
        for post in posts:
            title = getattr(post, "title", None)
            if not title or title in seen:
                continue
            seen.add(title)
            post_id = getattr(post, "id", None)
            permalink = getattr(post, "permalink", None)
            url = f"https://www.reddit.com{permalink}" if permalink else None
            created = getattr(post, "created_utc", None)
            dt = datetime.fromtimestamp(created, tz=timezone.utc) if created else None
            items.append(
                {
                    "source": "reddit",
                    "provider": "reddit",
                    "id": f"reddit:{post_id}" if post_id else stable_id("reddit", f"{subreddit}|{title}"),
                    "url": url,
                    "text": title,
                    "ts": dt,
                }
            )
    return items


def fetch_x_items(asset: AssetProfile) -> list[dict[str, Any]]:
    bearer_token = os.getenv("X_BEARER_TOKEN") or os.getenv("TWITTER_BEARER_TOKEN")
    if not bearer_token or asset.asset_class != "crypto":
        return []
    params = {
        "query": x_query(asset),
        "max_results": int(os.getenv("X_MAX_RESULTS", "25")),
        "tweet.fields": "created_at,public_metrics,author_id",
    }
    headers = {"Authorization": f"Bearer {bearer_token}"}
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(X_RECENT_SEARCH_URL, params=params, headers=headers)
            response.raise_for_status()
    except httpx.HTTPError as exc:
        logger.warning("X API fetch failed", extra={"ticker": asset.ticker, "error": str(exc)})
        return []
    items: list[dict[str, Any]] = []
    for tweet in response.json().get("data") or []:
        text = tweet.get("text")
        tweet_id = tweet.get("id")
        if not text or not tweet_id:
            continue
        created_at = tweet.get("created_at")
        dt = None
        if created_at:
            try:
                dt = datetime.fromisoformat(created_at.replace("Z", "+00:00")).astimezone(timezone.utc)
            except ValueError:
                dt = None
        items.append(
            {
                "source": "x",
                "provider": "x",
                "id": f"x:{tweet_id}",
                "url": f"https://x.com/i/web/status/{tweet_id}",
                "text": text,
                "ts": dt,
            }
        )
    return items

