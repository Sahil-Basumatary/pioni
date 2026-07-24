# Market Data Service

Real-time cryptocurrency price feeds from Binance via WebSocket.

## What it does

- Connects to Binance combined WebSocket streams for trade and kline (candlestick) data
- Normalizes exchange-specific data into a unified schema
- Publishes normalized prices to Redis Pub/Sub for downstream services
- Exposes REST endpoints for current prices and historical klines
- Automatic reconnection with exponential backoff

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service health |
| GET | `/health/ready` | Readiness (checks Binance WS + Redis) |
| GET | `/prices` | All current price snapshots |
| GET | `/prices/{symbol}` | Price snapshot for a symbol |
| GET | `/klines/{symbol}?interval=1m&limit=100` | Buffered kline data |

## Redis Pub/Sub Channels

- `market:trade:{SYMBOL}` — individual trade events
- `market:kline:{SYMBOL}:{INTERVAL}` — kline/candlestick updates

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `TRADING_SYMBOLS` | full Markets catalog (16 pairs) | Comma-separated symbols to track |
| `BINANCE_WS_URL` | `wss://stream.binance.com:9443` | Binance WebSocket base URL |
| `KLINE_INTERVALS` | `1m` | Candlestick intervals to subscribe to |
| `REDIS_URL` | — | Redis connection URL (optional) |

## Running

```bash
make dev-market-data
```
