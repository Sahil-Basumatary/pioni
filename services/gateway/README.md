# Gateway

API gateway. Routes requests to backend services, handles CORS, rate limiting, and injects request IDs.

## Setup

```bash
cd services/gateway
pip install -r requirements.txt
uvicorn gateway.main:app --reload
```

## Dependencies

The gateway proxies requests to the sentiment service. Ensure the sentiment service is running:

```bash
cd services/sentiment
uvicorn sentiment.main:app --reload --port 8001
```

## Endpoints

- `/health`, `/health/live`, `/health/ready` - health checks
- `/sentiment/{ticker}` - sentiment analysis (proxied to sentiment service)
- `/sentiment/history/{ticker}` - 7-day history
- `/sentiment/feed/{ticker}` - recent news/reddit feed

## Config

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `SENTIMENT_SERVICE_URL` | `http://localhost:8001` | Sentiment service base URL |
| `CORS_ORIGINS` | localhost dev ports | Comma-separated allowed origins |
| `REDIS_URL` | none | Redis connection URL |
| `PREWARM_ENABLED` | `true` | Enable cache prewarming on startup |
| `PREWARM_TICKERS` | `TSLA,AAPL,NVDA,AMZN,GOOGL` | Tickers to prewarm |

See `settings.py` for full configuration.
