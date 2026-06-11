import os
from dotenv import load_dotenv

load_dotenv()

def database_url() -> str:
    return os.getenv("DATABASE_URL", "")


def redis_url() -> str | None:
    return os.getenv("REDIS_URL") or None
