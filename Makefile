.PHONY: help install dev-gateway dev-sentiment dev-market-data dev-orders dev-portfolio dev-frontend test lint lint-python build infra infra-stop infra-logs infra-clean db-migrate db-upgrade db-downgrade db-current

help:
	@echo "Pioni Development Commands"
	@echo ""
	@echo "Services:"
	@echo "  make dev-gateway      Run gateway service (port 8000)"
	@echo "  make dev-sentiment    Run sentiment service (port 8001)"
	@echo "  make dev-market-data  Run market-data service (port 8002)"
	@echo "  make dev-orders       Run orders service (port 8003)"
	@echo "  make dev-portfolio    Run portfolio service (port 8004)"
	@echo ""
	@echo "Frontend:"
	@echo "  make dev-frontend     Run Vite dev server"
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
	@echo "Testing & Setup:"
	@echo "  make test             Run all service tests"
	@echo "  make install          Install shared libs (editable)"

install:
	pip install -e libs/common

dev-gateway:
	cd services/gateway && uvicorn gateway.main:app --reload

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

