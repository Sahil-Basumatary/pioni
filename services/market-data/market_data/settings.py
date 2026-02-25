import os
from dotenv import load_dotenv

load_dotenv()

BINANCE_WS_BASE = "wss://stream.binance.com:9443"


def redis_url() -> str | None:
    return os.getenv("REDIS_URL")


def redis_max_connections() -> int:
    return int(os.getenv("REDIS_MAX_CONNECTIONS", "10"))


def trading_symbols() -> list[str]:
    raw = os.getenv("TRADING_SYMBOLS", "BTCUSDT,ETHUSDT,SOLUSDT")
    return [s.strip().upper() for s in raw.split(",") if s.strip()]


def binance_ws_url() -> str:
    return os.getenv("BINANCE_WS_URL", BINANCE_WS_BASE)


def kline_intervals() -> list[str]:
    raw = os.getenv("KLINE_INTERVALS", "1m")
    return [i.strip() for i in raw.split(",") if i.strip()]
