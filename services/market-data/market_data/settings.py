import os
from pathlib import Path
from dotenv import load_dotenv

def _load_dotenv_files() -> None:
    # Cwd first (service-local), then nearest repo .env for `make` from services/*.
    # Walk parents so Docker/Render (/app/...) never IndexError on parents[3].
    load_dotenv()
    for parent in Path(__file__).resolve().parents:
        candidate = parent / ".env"
        if candidate.is_file():
            load_dotenv(candidate)
            return

_load_dotenv_files()

BINANCE_WS_BASE = "wss://stream.binance.com:9443"


def redis_url() -> str | None:
    return os.getenv("REDIS_URL", "redis://localhost:6379")


def redis_max_connections() -> int:
    return int(os.getenv("REDIS_MAX_CONNECTIONS", "10"))


DEFAULT_SYMBOLS = (
    "BTCUSDT,ETHUSDT,SOLUSDT,XRPUSDT,ADAUSDT,DOGEUSDT,"
    "LTCUSDT,LINKUSDT,AVAXUSDT,DOTUSDT,APTUSDT,ATOMUSDT,"
    "BCHUSDT,POLUSDT,XLMUSDT,ARBUSDT,"
    "ALGOUSDT,INJUSDT,TIAUSDT,FLOWUSDT,XTZUSDT"
)


def trading_symbols() -> list[str]:
    raw = os.getenv("TRADING_SYMBOLS", DEFAULT_SYMBOLS)
    return [s.strip().upper() for s in raw.split(",") if s.strip()]


def binance_ws_url() -> str:
    return os.getenv("BINANCE_WS_URL", BINANCE_WS_BASE)


def kline_intervals() -> list[str]:
    raw = os.getenv("KLINE_INTERVALS", "1m")
    return [i.strip() for i in raw.split(",") if i.strip()]
