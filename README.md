# Pioni

[pioni.ai](https://pioni.ai) is a live paper-trading platform for practising crypto orders with live market data and simulated USD.

## What it includes

- Spot and margin paper trading with market, limit, stop-loss, IOC, and FOK orders
- Live prices, order books, market trades, and chart data
- Portfolio balances, positions, history, P&L, and risk metrics
- Market sentiment from news and social sources
- Price alerts, favourites, layouts, onboarding, and account settings

No real funds or exchange orders are involved.

## Stack

- React 19, TypeScript, Vite, Redux Toolkit, and Tailwind CSS
- FastAPI services for the gateway, sentiment, market data, orders, and portfolios
- PostgreSQL for account and trading state
- Redis for caching, live prices, and pub/sub
- RabbitMQ for executed-trade events
- Clerk for authentication and Resend for email
- Prometheus, Grafana, Jaeger, and OpenTelemetry for observability
- Vitest, Cypress, Pytest, Ruff, and GitHub Actions for verification

## Architecture

```text
React frontend
  -> API gateway
     -> sentiment service
     -> market-data service
     -> orders service
     -> portfolio service

market data -> Redis -> gateway and portfolio
orders -> RabbitMQ -> portfolio
portfolio -> Redis -> gateway WebSocket -> frontend
```

The services can scale and fail independently, but the split adds more local setup and operational work. Postgres is still our baseline. 

Portfolio event deduplication is process-local. Persistent deduplication is required before running multiple portfolio workers. Market and sentiment coverage also depends on external providers and their availability.

## Run locally

Requirements:

- Python 3.12
- Node.js 20
- Docker
- GNU Make

```bash
git clone https://github.com/Sahil-Basumatary/pioni.git
cd pioni

python3.12 -m venv .venv
source .venv/bin/activate

python -m pip install -e libs/common
python -m pip install -r services/gateway/requirements.txt
python -m pip install -r services/sentiment/requirements.txt
python -m pip install -r services/market-data/requirements.txt
python -m pip install -r services/orders/requirements.txt
python -m pip install -r services/portfolio/requirements.txt

npm --prefix frontend ci

cp .env.example .env
cp frontend/.env.example frontend/.env
```

Set the Clerk keys in both environment files. Add sentiment provider keys for live sentiment but mock mode will work without them.

Start the infrastructure, apply migrations, then run the stack:

```bash
make infra
make db-upgrade
make dev
```

Open [http://localhost:5173](http://localhost:5173).

## Checks

```bash
make lint
make test
npm --prefix frontend run typecheck
npm --prefix frontend run test:run
npm --prefix frontend run build
```

Load-test and frontend performance notes live in [`loadtest/`](loadtest/) and [`frontend/docs/`](frontend/docs/).

## Contact

- Email: [sahil@sahilbasumatary.dev](mailto:sahil@sahilbasumatary.dev)
- Website [sahilbzy.com](https://sahilbzy.com)
- GitHub: [Sahil-Basumatary](https://github.com/Sahil-Basumatary)
- LinkedIn: [Sahil Basumatary](https://www.linkedin.com/in/sahil-basumatary/)

## License

Pioni is source-available under the [PolyForm Noncommercial License 1.0.0](LICENSE). Commercial use is not permitted without separate permission.
