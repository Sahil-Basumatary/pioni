# Gateway

API gateway. Routes requests, handles rate limiting, injects request IDs.

## Setup

```bash
cd services/gateway
pip install -r requirements.txt
```

During migration, sentiment services still live in `src/backend/services/`. Set PYTHONPATH:

```bash
export PYTHONPATH="${PYTHONPATH}:../../src"
uvicorn gateway.main:app --reload
```

## Endpoints

- `/health`, `/health/live`, `/health/ready` - health checks
- `/sentiment/{ticker}` - sentiment analysis
- `/sentiment/history/{ticker}` - 7-day history
- `/sentiment/feed/{ticker}` - recent news/reddit feed

## Config

Uses env vars for CORS, rate limits, Redis, etc. See `settings.py`.

