import os
from decimal import Decimal
from dotenv import load_dotenv

load_dotenv()

def database_url() -> str:
    return os.getenv("DATABASE_URL", "")

def rabbitmq_url() -> str:
    return os.getenv("RABBITMQ_URL", "")

def redis_url() -> str:
    return os.getenv("REDIS_URL", "")

def market_data_service_url() -> str:
    return os.getenv("MARKET_DATA_SERVICE_URL", "http://localhost:8002").rstrip("/")

def trading_symbols() -> list[str]:
    raw = os.getenv(
        "TRADING_SYMBOLS",
        "BTCUSDT,ETHUSDT,SOLUSDT,XRPUSDT,ADAUSDT,DOGEUSDT,"
        "LTCUSDT,LINKUSDT,AVAXUSDT,DOTUSDT,APTUSDT,ATOMUSDT,"
        "BCHUSDT,POLUSDT,XLMUSDT,ARBUSDT,"
        "ALGOUSDT,INJUSDT,TIAUSDT,FLOWUSDT,XTZUSDT",
    )
    return [s.strip().upper() for s in raw.split(",") if s.strip()]

def maker_liquidity_enabled() -> bool:
    return os.getenv("MAKER_LIQUIDITY_ENABLED", "true").lower() in ("1", "true", "yes")

def maker_levels() -> int:
    return max(1, min(20, int(os.getenv("MAKER_LEVELS", "5"))))

def maker_spread_bps() -> Decimal:
    return Decimal(os.getenv("MAKER_SPREAD_BPS", "5"))

def maker_notional_usd() -> Decimal:
    return Decimal(os.getenv("MAKER_NOTIONAL_USD", "2500"))

def maker_rebalance_interval_s() -> float:
    return max(0.25, float(os.getenv("MAKER_REBALANCE_INTERVAL_MS", "1000")) / 1000.0)

def maker_move_bps() -> Decimal:
    return Decimal(os.getenv("MAKER_MOVE_BPS", "3"))

MAKER_CLERK_ID = "system:pioni-maker"
MAKER_EMAIL = "maker@system.pioni.local"
MAKER_USERNAME = "pioni-maker"
MAKER_CASH = Decimal("999999999999.99")
MAKER_POSITION_QTY = Decimal("1000000")
