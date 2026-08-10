# Gateway

Public API for the Pioni frontend. It verifies Clerk tokens, applies CORS and rate limits, attaches request IDs, proxies service calls, and streams live updates.

## Run

From the repository root:

```bash
make dev-gateway
```

The gateway listens on port 8000. Its downstream services use ports 8001–8004.

## Routes

Public routes:

- `GET /health`, `/health/live`, `/health/ready`
- `GET /sentiment/{ticker}`, `/sentiment/history/{ticker}`, `/sentiment/signals/{ticker}`, `/sentiment/feed/{ticker}`
- `GET /market/prices`, `/market/prices/{symbol}`, `/market/klines/{symbol}`
- `GET /orderbook/{symbol}`
- `WS /ws/market`

Authenticated routes:

- `GET /me`
- `/me/portfolio`, `/me/summary`, `/me/positions`, `/me/trades`, `/me/ledger`, `/me/pnl-chart`
- `/me/onboarding`, `/me/api-keys`, `/me/notification-prefs`, `/me/favorites`, `/me/alerts`
- `POST /me/portfolio/reset`
- `POST|GET|DELETE /orders`
- `WS /ws/orders`, `/ws/portfolio`

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `SENTIMENT_SERVICE_URL` | `http://localhost:8001` | Sentiment service |
| `MARKET_DATA_SERVICE_URL` | `http://localhost:8002` | Market-data service |
| `ORDERS_SERVICE_URL` | `http://localhost:8003` | Orders service |
| `PORTFOLIO_SERVICE_URL` | `http://localhost:8004` | Portfolio service |
| `CORS_ORIGINS` | local frontend ports | Allowed browser origins |
| `CLERK_ISSUER` | none | JWT issuer |
| `CLERK_AUTHORIZED_PARTIES` | local frontend ports | Accepted JWT parties |
| `REDIS_URL` | none | Cache and pub/sub connection |
| `RATE_LIMIT_ENABLED` | `true` | Request limiting |
| `MARKET_CACHE_TTL_MS` | `500` | Market snapshot cache |
| `PREWARM_ENABLED` | `true` | Sentiment cache prewarm |

See `gateway/settings.py` and the root `.env.example` for the full list.
