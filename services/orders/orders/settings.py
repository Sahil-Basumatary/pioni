import os
from dotenv import load_dotenv

load_dotenv()

def database_url() -> str:
    return os.getenv("DATABASE_URL", "")

def rabbitmq_url() -> str:
    return os.getenv("RABBITMQ_URL", "")

def redis_url() -> str:
    return os.getenv("REDIS_URL", "")
