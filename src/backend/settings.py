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