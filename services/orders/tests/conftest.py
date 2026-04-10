import os
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("RABBITMQ_URL", "amqp://guest:guest@localhost/")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379")

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
import pytest
from orders.service import OrderService


@pytest.fixture
def mock_rmq():
    rmq = AsyncMock()
    rmq.connected = True
    return rmq


@pytest.fixture
def mock_redis():
    return AsyncMock()


@pytest.fixture
def mock_session():
    session = AsyncMock()
    session.add = MagicMock()
    async def _refresh(obj):
        now = datetime.now(timezone.utc)
        if not getattr(obj, "created_at", None):
            obj.created_at = now
        if not getattr(obj, "updated_at", None):
            obj.updated_at = now
    session.refresh.side_effect = _refresh
    return session


@pytest.fixture
def order_service(mock_rmq, mock_redis):
    return OrderService(mock_rmq, mock_redis)


@pytest.fixture
def portfolio_id():
    return uuid.uuid4()


@pytest.fixture
def active_portfolio(portfolio_id):
    p = MagicMock()
    p.id = portfolio_id
    p.is_active = True
    return p
