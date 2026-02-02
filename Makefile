.PHONY: help install dev-gateway dev-sentiment dev-market-data dev-orders dev-portfolio dev-frontend test lint build

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
	@echo "  make lint             Run ESLint on frontend"
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

lint:
	cd frontend && npm run lint

build:
	cd frontend && npm run build

