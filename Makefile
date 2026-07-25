.PHONY: help install dev dev-gateway dev-gateway-perf dev-sentiment dev-market-data dev-orders dev-portfolio dev-frontend test lint lint-python build infra infra-stop infra-logs infra-clean db-migrate db-upgrade db-downgrade db-current load-market load-orders

help:
	@echo "Pioni Development Commands"
	@echo ""
	@echo "All-in-one:"
	@echo "  make dev              Start infra + all app services in one terminal"
	@echo ""
	@echo "Services:"
	@echo "  make dev-gateway      Run gateway service (port 8000)"
	@echo "  make dev-gateway-perf Run gateway with multiple workers (no reload)"
	@echo "  make dev-sentiment    Run sentiment service (port 8001)"
	@echo "  make dev-market-data  Run market-data service (port 8002)"
	@echo "  make dev-orders       Run orders service (port 8003)"
	@echo "  make dev-portfolio    Run portfolio service (port 8004)"
	@echo ""
	@echo "Frontend:"
	@echo "  make dev-frontend     Run Vite dev server (http://localhost:5173)"
	@echo "  make build            Build frontend for production"
	@echo "  make lint             Run all linters"
	@echo "  make lint-python      Run ruff on Python code"
	@echo ""
	@echo "Infrastructure:"
	@echo "  make infra            Start Postgres, Redis, RabbitMQ"
	@echo "  make infra-stop       Stop infrastructure containers"
	@echo "  make infra-logs       Tail infrastructure logs"
	@echo "  make infra-clean      Stop and remove volumes (wipes data)"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate msg=  Generate a new Alembic migration"
	@echo "  make db-upgrade       Apply all pending migrations"
	@echo "  make db-downgrade     Rollback one migration"
	@echo "  make db-current       Show current migration version"
	@echo ""
	@echo "Load testing (requires k6 + running services):"
	@echo "  make load-market      k6 load test the gateway market read path"
	@echo "  make load-orders      k6 load test order submission throughput"
	@echo ""
	@echo "Testing & Setup:"
	@echo "  make test             Run all service tests"
	@echo "  make install          Install shared libs (editable)"

install:
	pip install -e libs/common

dev-gateway:
	cd services/gateway && SSL_CERT_FILE=$${SSL_CERT_FILE:-$$(python3 -c 'import certifi; print(certifi.where())')} uvicorn gateway.main:app --reload

dev-gateway-perf:
	@mkdir -p $${PROMETHEUS_MULTIPROC_DIR:-/tmp/pioni-gw-metrics}
	cd services/gateway && PROMETHEUS_MULTIPROC_DIR=$${PROMETHEUS_MULTIPROC_DIR:-/tmp/pioni-gw-metrics} uvicorn gateway.main:app --workers $${WORKERS:-8} --no-access-log

dev-sentiment:
	cd services/sentiment && uvicorn sentiment.main:app --reload --port 8001

dev-market-data:
	cd services/market-data && uvicorn market_data.main:app --reload --port 8002

dev-orders:
	cd services/orders && uvicorn orders.main:app --reload --port 8003

dev-portfolio:
	cd services/portfolio && uvicorn portfolio.main:app --reload --port 8004

dev-frontend:
	cd frontend && npm run dev

dev: infra
	@echo "Starting Pioni stack — frontend http://localhost:5173  gateway http://localhost:8000"
	@npx --yes concurrently \
		--kill-others-on-fail false \
		--restart-tries 0 \
		--names "gateway,sentiment,market,orders,portfolio,frontend" \
		--prefix-colors "blue,magenta,cyan,green,yellow,white" \
		"$(MAKE) dev-gateway" \
		"$(MAKE) dev-sentiment" \
		"$(MAKE) dev-market-data" \
		"$(MAKE) dev-orders" \
		"$(MAKE) dev-portfolio" \
		"$(MAKE) dev-frontend"

test:
	pytest services/ -v

lint: lint-python
	cd frontend && npm run lint

lint-python:
	ruff check services/ libs/

build:
	cd frontend && npm run build

infra:
	docker compose up -d postgres redis rabbitmq

infra-stop:
	docker compose stop

infra-logs:
	docker compose logs -f

infra-clean:
	docker compose down -v

db-migrate:
	alembic revision --autogenerate -m "$(msg)"

db-upgrade:
	alembic upgrade head

db-downgrade:
	alembic downgrade -1

db-current:
	alembic current

load-market:
	k6 run loadtest/gateway_market_read.js

load-orders:
	k6 run loadtest/orders_submit.js

