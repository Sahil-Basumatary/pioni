# Orders

Paper-order service with in-memory order books and PostgreSQL order persistence.

## Responsibilities

- Validate market, limit, stop-loss, IOC, and FOK orders
- Check portfolio buying power and held quantity
- Match orders with price-time priority
- Persist order state
- Publish order and trade events to RabbitMQ
- Maintain synthetic maker liquidity around live market prices
- Expose order and order-book metrics

## Run

From the repository root:

```bash
make infra
make db-upgrade
make dev-orders
```

The service listens on port 8003.

## API

- `POST /orders`
- `GET /orders`
- `GET /orders/{order_id}`
- `DELETE /orders/{order_id}`
- `GET /orderbook/{symbol}`
- `GET /health`, `/health/live`, `/health/ready`
- `GET /metrics`

The gateway owns user authentication. Direct service calls require a valid `portfolio_id`.

## Events

RabbitMQ routing keys:

- `order.accepted.{symbol}`
- `order.filled.{symbol}`
- `order.cancelled.{symbol}`
- `order.rejected.{symbol}`
- `trade.executed.{symbol}`

The portfolio service consumes executed trades and updates cash, positions, P&L, and history.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | none | PostgreSQL connection |
| `RABBITMQ_URL` | none | Order and trade events |
| `REDIS_URL` | none | Live market data |
| `MARKET_DATA_SERVICE_URL` | `http://localhost:8002` | Price snapshots |
| `TRADING_SYMBOLS` | market catalogue | Supported symbols |
| `MAKER_LIQUIDITY_ENABLED` | `true` | Synthetic resting liquidity |
| `MAKER_LEVELS` | `5` | Levels per side |
| `MAKER_SPREAD_BPS` | `5` | Initial spread |
| `MAKER_NOTIONAL_USD` | `2500` | Notional per level |
| `MAKER_REBALANCE_INTERVAL_MS` | `1000` | Refresh interval |
| `MAKER_MOVE_BPS` | `3` | Price-move threshold |

Matching-engine micro-benchmarks are in [`benchmarks/RESULTS.md`](benchmarks/RESULTS.md). Full HTTP and database load tests are in [`../../loadtest/`](../../loadtest/).
