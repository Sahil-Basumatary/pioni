import os
from pathlib import Path
from dotenv import load_dotenv

# Prefer service-local .env, then repo root (make targets cd into services/*).
load_dotenv()
load_dotenv(Path(__file__).resolve().parents[3] / ".env")

def is_mock_mode() -> bool:
    return os.getenv("MOCK", "true").lower() == "true"

def cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "").strip()
    if raw:
        return [o.strip() for o in raw.split(",") if o.strip()]
    # Vite hops ports when 5173 is taken — cover the common local range.
    ports = range(5173, 5191)
    origins: list[str] = []
    for port in ports:
        origins.append(f"http://localhost:{port}")
        origins.append(f"http://127.0.0.1:{port}")
    return origins

def prewarm_tickers() -> list[str]:
    raw = os.getenv("PREWARM_TICKERS", "TSLA,AAPL,NVDA,AMZN,GOOGL")
    return [t.strip().upper() for t in raw.split(",") if t.strip()]

def prewarm_enabled() -> bool:
    return os.getenv("PREWARM_ENABLED", "true").lower() == "true"

def redis_url() -> str | None:
    return os.getenv("REDIS_URL", "redis://localhost:6379")

def redis_max_connections() -> int:
    return int(os.getenv("REDIS_MAX_CONNECTIONS", "10"))

def hf_api_token() -> str | None:
    return os.getenv("HF_API_TOKEN")

def sentiment_service_url() -> str:
    hostport = os.getenv("SENTIMENT_SERVICE_HOST")
    if hostport:
        return f"http://{hostport}"
    return os.getenv("SENTIMENT_SERVICE_URL", "http://localhost:8001")


def market_data_service_url() -> str:
    hostport = os.getenv("MARKET_DATA_SERVICE_HOST")
    if hostport:
        return f"http://{hostport}"
    return os.getenv("MARKET_DATA_SERVICE_URL", "http://localhost:8002")

def market_cache_ttl() -> float:
    return float(os.getenv("MARKET_CACHE_TTL_MS", "500")) / 1000.0

def orders_service_url() -> str:
    hostport = os.getenv("ORDERS_SERVICE_HOST")
    if hostport:
        return f"http://{hostport}"
    return os.getenv("ORDERS_SERVICE_URL", "http://localhost:8003")

def portfolio_service_url() -> str:
    hostport = os.getenv("PORTFOLIO_SERVICE_HOST")
    if hostport:
        return f"http://{hostport}"
    return os.getenv("PORTFOLIO_SERVICE_URL", "http://localhost:8004")

def portfolio_cache_ttl() -> float:
    return float(os.getenv("PORTFOLIO_ID_CACHE_TTL_SECONDS", "300"))

def portfolio_cache_redis_ttl() -> int:
    return int(os.getenv("PORTFOLIO_ID_REDIS_TTL_SECONDS", "3600"))

def user_email_cache_ttl() -> float:
    return float(os.getenv("USER_EMAIL_CACHE_TTL_SECONDS", "900"))

def clerk_secret_key() -> str | None:
    key = os.getenv("CLERK_SECRET_KEY", "").strip()
    return key or None

def clerk_metadata_sync_enabled() -> bool:
    # The write-back to Clerk is what promotes a user into the zero-hop tier, but it only works
    # with a backend secret; disabled automatically when the secret is absent (e.g. local dev).
    if os.getenv("CLERK_METADATA_SYNC_ENABLED", "").strip().lower() in {"0", "false", "no"}:
        return False
    return clerk_secret_key() is not None

def clerk_issuer() -> str | None:
    issuer = os.getenv("CLERK_ISSUER", "").strip()
    return issuer or None

def clerk_jwks_url() -> str | None:
    url = os.getenv("CLERK_JWKS_URL", "").strip()
    if url:
        return url
    issuer = clerk_issuer()
    return f"{issuer.rstrip('/')}/.well-known/jwks.json" if issuer else None

def clerk_authorized_parties() -> list[str]:
    raw = os.getenv("CLERK_AUTHORIZED_PARTIES", "").strip()
    return [p.strip() for p in raw.split(",") if p.strip()]

