from __future__ import annotations
import json
from unittest.mock import AsyncMock, MagicMock
import pytest
from starlette.websockets import WebSocketState
from gateway.ws import PortfolioConnectionManager, MAX_SUBSCRIPTIONS_PER_CLIENT


def _ws() -> MagicMock:
    ws = MagicMock()
    ws.accept = AsyncMock()
    ws.send_text = AsyncMock()
    ws.client_state = WebSocketState.CONNECTED
    return ws


@pytest.fixture
def manager() -> PortfolioConnectionManager:
    return PortfolioConnectionManager()


async def test_connect_accepts_and_tracks(manager):
    ws = _ws()
    await manager.connect(ws)
    ws.accept.assert_awaited_once()
    assert manager.active_count == 1


async def test_disconnect_drops_connection(manager):
    ws = _ws()
    await manager.connect(ws)
    await manager.disconnect(ws)
    assert manager.active_count == 0


async def test_subscribe_returns_current_set(manager):
    ws = _ws()
    await manager.connect(ws)
    current = await manager.subscribe(ws, ["pf-1", "pf-2"])
    assert current == {"pf-1", "pf-2"}


async def test_unsubscribe_removes_only_listed(manager):
    ws = _ws()
    await manager.connect(ws)
    await manager.subscribe(ws, ["pf-1", "pf-2", "pf-3"])
    remaining = await manager.unsubscribe(ws, ["pf-2"])
    assert remaining == {"pf-1", "pf-3"}


async def test_subscribe_caps_at_max_per_client(manager):
    ws = _ws()
    await manager.connect(ws)
    over_cap = [f"pf-{i}" for i in range(MAX_SUBSCRIPTIONS_PER_CLIENT + 5)]
    current = await manager.subscribe(ws, over_cap)
    assert len(current) == MAX_SUBSCRIPTIONS_PER_CLIENT


async def test_subscribe_unknown_websocket_returns_empty(manager):
    ghost = _ws()
    current = await manager.subscribe(ghost, ["pf-1"])
    assert current == set()


async def test_broadcast_only_to_subscribed_clients(manager):
    listener = _ws()
    bystander = _ws()
    await manager.connect(listener)
    await manager.connect(bystander)
    await manager.subscribe(listener, ["pf-1"])
    await manager.subscribe(bystander, ["pf-2"])

    await manager.broadcast_portfolio_update(
        "pf-1", {"cash_balance": "99500"},
    )

    listener.send_text.assert_awaited_once()
    bystander.send_text.assert_not_awaited()
    payload = json.loads(listener.send_text.await_args.args[0])
    assert payload == {
        "type": "portfolio_update",
        "portfolio_id": "pf-1",
        "data": {"cash_balance": "99500"},
    }


async def test_broadcast_skips_disconnected_clients(manager):
    ws = _ws()
    ws.client_state = WebSocketState.DISCONNECTED
    await manager.connect(ws)
    await manager.subscribe(ws, ["pf-1"])

    await manager.broadcast_portfolio_update("pf-1", {"x": 1})

    ws.send_text.assert_not_awaited()


async def test_broadcast_evicts_clients_that_raise(manager):
    flaky = _ws()
    flaky.send_text.side_effect = RuntimeError("connection reset")
    healthy = _ws()
    await manager.connect(flaky)
    await manager.connect(healthy)
    await manager.subscribe(flaky, ["pf-1"])
    await manager.subscribe(healthy, ["pf-1"])

    await manager.broadcast_portfolio_update("pf-1", {"x": 1})

    healthy.send_text.assert_awaited_once()
    assert manager.active_count == 1
