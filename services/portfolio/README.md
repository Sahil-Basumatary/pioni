# Portfolio Service

Portfolio owns account state after trades execute. The matching engine decides what filled;
portfolio turns those fills into cash, positions, P&L, snapshots, and risk metrics.

## Responsibilities

- Consume `TradeExecuted` events from RabbitMQ.
- Apply BUY/SELL fills with average cost basis.
- Persist cash balances, positions, trades, and time-series portfolio snapshots.
- Expose portfolio, position, trade, summary, and P&L chart APIs.
- Maintain an in-memory live price cache from Redis market trade events.
- Publish portfolio update events to Redis so the gateway can push WebSocket updates.

## Flow

```text
Orders service
  -> RabbitMQ trade.executed.*
  -> Portfolio TradeConsumer
  -> Postgres portfolios / positions / trades / portfolio_snapshots
  -> Redis portfolio:updated:{portfolio_id}
  -> Gateway /ws/portfolio
  -> Frontend
```

Market prices flow separately:

```text
Market-data service
  -> Redis market:trade:{symbol}
  -> Portfolio PriceCache
  -> /portfolios/{id}/summary and /positions responses
```

## Domain Model

The core math lives in pure modules:

- `state.py`: applies fills to portfolio and position state.
- `valuation.py`: calculates market value and unrealized P&L.
- `charts.py`: builds daily P&L chart points from snapshots.
- `risk.py`: calculates returns, Sharpe ratio, max drawdown, and historical VaR.

These modules take dataclasses and primitive values rather than ORM rows. That keeps the
financial logic easy to test and keeps database/session concerns in the route or repository
layer.

## Cost Basis

Positions use average cost basis:

- BUY increases quantity and recomputes weighted average entry price.
- SELL reduces quantity and realizes `(sell_price - avg_entry_price) * qty - fee`.
- Full close resets average entry price to zero so reopened positions start cleanly.

Short selling is not supported in v1. Orders service checks buying power and held quantity
before accepting an order; portfolio still validates sell quantities as a domain invariant.

## Consistency Rules

- Portfolio and position rows are loaded with `FOR UPDATE` when applying fills.
- Portfolio update WebSocket events publish only after the DB transaction commits.
- Redis publishing is best effort. Postgres is the source of truth.
- Trade event idempotency is currently in-process LRU deduplication. Persistent dedupe by
  event id should be added before running multiple portfolio workers.

## APIs

- `GET /portfolios/{portfolio_id}`: portfolio metadata and cash.
- `GET /portfolios/{portfolio_id}/positions`: positions with optional market price and
  unrealized P&L.
- `GET /portfolios/{portfolio_id}/trades`: executed trades, paginated.
- `GET /portfolios/{portfolio_id}/summary`: portfolio, positions, total value, realized P&L,
  and unrealized P&L.
- `GET /portfolios/{portfolio_id}/pnl-chart`: one daily point per day from snapshots:
  date, total value, daily P&L, and cumulative P&L.

## Risk Metrics

Risk metrics are calculated from `portfolio_snapshots`:

- Returns: simple period returns sorted by snapshot time.
- Sharpe ratio: annualized with 365 periods because crypto trades every day.
- Max drawdown: positive peak-to-trough loss magnitude.
- Historical VaR 95%: positive 5th-percentile loss magnitude from historical returns.

## Operational Notes

- The price cache is intentionally in-memory. It warms from the next market trade event after
  startup; stale prices return `None` rather than pretending the value is fresh.
- The daily P&L chart uses the latest snapshot per calendar day.
- Snapshot frequency can start simple. If write volume grows, `portfolio_snapshots` already
  has a `(portfolio_id, snapshot_at)` index and can later move cleanly to TimescaleDB.

## Test Focus

Most coverage is at the pure-function layer because that is where correctness matters most:

- fill state machine
- valuation and unrealized P&L
- daily chart construction
- Sharpe, drawdown, and VaR
- Redis publish/subscribe adapters where they shape external contracts
