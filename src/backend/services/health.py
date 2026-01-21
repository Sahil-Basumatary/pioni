import os
from datetime import datetime, timezone
from typing import Any
from backend.core.cache import ping_redis

async def check_redis() -> dict[str, Any]:
    ok, latency_ms, error = await ping_redis()
    if ok:
        return {"status": "healthy", "latency_ms": latency_ms}
    if error == "not_configured":
        return {"status": "degraded", "configured": False}
    return {"status": "unhealthy", "error": error}

def check_hf_config() -> dict[str, Any]:
    token = os.getenv("HF_API_TOKEN")
    if token:
        return {"status": "healthy", "configured": True}
    return {"status": "degraded", "configured": False}

def check_news_config() -> dict[str, Any]:
    key = os.getenv("NEWS_API_KEY")
    if key:
        return {"status": "healthy", "configured": True}
    return {"status": "unhealthy", "configured": False}

def check_reddit_config() -> dict[str, Any]:
    client_id = os.getenv("REDDIT_CLIENT_ID")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET")
    if client_id and client_secret:
        return {"status": "healthy", "configured": True}
    return {"status": "unhealthy", "configured": False}

async def get_health_status() -> tuple[dict[str, Any], int]:
    redis_check = await check_redis()
    hf_check = check_hf_config()
    news_check = check_news_config()
    reddit_check = check_reddit_config()
    checks = {
        "redis": redis_check,
        "huggingface": hf_check,
        "newsapi": news_check,
        "reddit": reddit_check,
    }
    news_ok = news_check["status"] == "healthy"
    reddit_ok = reddit_check["status"] == "healthy"
    if not news_ok and not reddit_ok:
        overall = "unhealthy"
        http_status = 503
    elif all(c["status"] == "healthy" for c in checks.values()):
        overall = "healthy"
        http_status = 200
    else:
        overall = "degraded"
        http_status = 200
    timestamp = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    return {
        "status": overall,
        "timestamp": timestamp,
        "version": "0.3.0",
        "checks": checks,
    }, http_status
