import os
from dotenv import load_dotenv

load_dotenv()

def is_mock_mode() -> bool:
    return os.getenv("MOCK", "true").lower() == "true"

def cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "").strip()
    if raw:
        return [o.strip() for o in raw.split(",") if o.strip()]
    return [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5174"
    ]

def prewarm_tickers() -> list[str]:
    raw = os.getenv("PREWARM_TICKERS", "TSLA,AAPL,NVDA,AMZN,GOOGL")
    return [t.strip().upper() for t in raw.split(",") if t.strip()]

def prewarm_enabled() -> bool:
    return os.getenv("PREWARM_ENABLED", "true").lower() == "true"

def redis_url() -> str | None:
    return os.getenv("REDIS_URL")

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

