import os
os.environ.setdefault("MOCK", "true")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379")
os.environ.setdefault("FINBERT_ENABLED", "false")
os.environ.setdefault("RATE_LIMIT_ENABLED", "false")
