import asyncio
import json
import logging
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

logger = logging.getLogger(__name__)
ws_router = APIRouter()
MAX_SUBSCRIPTIONS_PER_CLIENT = 20


class ConnectionManager:
    def __init__(self):
        self._connections: dict[WebSocket, set[str]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self._connections[ws] = set()

    async def disconnect(self, ws: WebSocket) -> None:
        async with self._lock:
            self._connections.pop(ws, None)

    async def subscribe(self, ws: WebSocket, symbols: list[str]) -> set[str]:
        async with self._lock:
            subs = self._connections.get(ws)
            if subs is None:
                return set()
            for s in symbols:
                if len(subs) >= MAX_SUBSCRIPTIONS_PER_CLIENT:
                    break
                subs.add(s.upper())
            return set(subs)

    async def unsubscribe(self, ws: WebSocket, symbols: list[str]) -> set[str]:
        async with self._lock:
            subs = self._connections.get(ws)
            if subs is None:
                return set()
            for s in symbols:
                subs.discard(s.upper())
            return set(subs)

    async def broadcast_trade(self, symbol: str, data: dict) -> None:
        now_ms = int(time.time() * 1000)
        latency = dict(data.get("latency") or {})
        latency["gateway_received_at_ms"] = now_ms
        latency["gateway_sent_at_ms"] = int(time.time() * 1000)
        payload = {**data, "latency": latency}
        msg = json.dumps({"type": "trade", "symbol": symbol, "data": payload})
        await self._broadcast(symbol, msg)

    async def broadcast_kline(self, symbol: str, interval: str, data: dict) -> None:
        msg = json.dumps({
            "type": "kline", "symbol": symbol,
            "interval": interval, "data": data,
        })
        await self._broadcast(symbol, msg)

    async def _broadcast(self, symbol: str, message: str) -> None:
        async with self._lock:
            targets = [
                ws for ws, subs in self._connections.items()
                if symbol in subs
            ]
        stale: list[WebSocket] = []
        for ws in targets:
            try:
                if ws.client_state == WebSocketState.CONNECTED:
                    await ws.send_text(message)
            except Exception:
                stale.append(ws)
        if stale:
            async with self._lock:
                for ws in stale:
                    self._connections.pop(ws, None)

    @property
    def active_count(self) -> int:
        return len(self._connections)


class OrderConnectionManager:
    def __init__(self):
        self._connections: dict[WebSocket, set[str]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self._connections[ws] = set()

    async def disconnect(self, ws: WebSocket) -> None:
        async with self._lock:
            self._connections.pop(ws, None)

    async def subscribe(self, ws: WebSocket, portfolio_ids: list[str]) -> set[str]:
        async with self._lock:
            subs = self._connections.get(ws)
            if subs is None:
                return set()
            for pid in portfolio_ids:
                if len(subs) >= MAX_SUBSCRIPTIONS_PER_CLIENT:
                    break
                subs.add(pid)
            return set(subs)

    async def unsubscribe(self, ws: WebSocket, portfolio_ids: list[str]) -> set[str]:
        async with self._lock:
            subs = self._connections.get(ws)
            if subs is None:
                return set()
            for pid in portfolio_ids:
                subs.discard(pid)
            return set(subs)

    async def broadcast_order_update(self, portfolio_id: str, data: dict) -> None:
        msg = json.dumps({"type": "order_update", "portfolio_id": portfolio_id, "data": data})
        async with self._lock:
            targets = [
                ws for ws, subs in self._connections.items()
                if portfolio_id in subs
            ]
        stale: list[WebSocket] = []
        for ws in targets:
            try:
                if ws.client_state == WebSocketState.CONNECTED:
                    await ws.send_text(msg)
            except Exception:
                stale.append(ws)
        if stale:
            async with self._lock:
                for ws in stale:
                    self._connections.pop(ws, None)

    @property
    def active_count(self) -> int:
        return len(self._connections)


class PortfolioConnectionManager:
    def __init__(self):
        self._connections: dict[WebSocket, set[str]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self._connections[ws] = set()

    async def disconnect(self, ws: WebSocket) -> None:
        async with self._lock:
            self._connections.pop(ws, None)

    async def subscribe(self, ws: WebSocket, portfolio_ids: list[str]) -> set[str]:
        async with self._lock:
            subs = self._connections.get(ws)
            if subs is None:
                return set()
            for pid in portfolio_ids:
                if len(subs) >= MAX_SUBSCRIPTIONS_PER_CLIENT:
                    break
                subs.add(pid)
            return set(subs)

    async def unsubscribe(self, ws: WebSocket, portfolio_ids: list[str]) -> set[str]:
        async with self._lock:
            subs = self._connections.get(ws)
            if subs is None:
                return set()
            for pid in portfolio_ids:
                subs.discard(pid)
            return set(subs)

    async def broadcast_portfolio_update(
        self, portfolio_id: str, data: dict,
    ) -> None:
        msg = json.dumps({
            "type": "portfolio_update",
            "portfolio_id": portfolio_id,
            "data": data,
        })
        async with self._lock:
            targets = [
                ws for ws, subs in self._connections.items()
                if portfolio_id in subs
            ]
        stale: list[WebSocket] = []
        for ws in targets:
            try:
                if ws.client_state == WebSocketState.CONNECTED:
                    await ws.send_text(msg)
            except Exception:
                stale.append(ws)
        if stale:
            async with self._lock:
                for ws in stale:
                    self._connections.pop(ws, None)

    @property
    def active_count(self) -> int:
        return len(self._connections)


_manager: ConnectionManager | None = None
_order_manager: OrderConnectionManager | None = None
_portfolio_manager: PortfolioConnectionManager | None = None


def get_manager() -> ConnectionManager:
    global _manager
    if _manager is None:
        _manager = ConnectionManager()
    return _manager


def set_manager(mgr: ConnectionManager) -> None:
    global _manager
    _manager = mgr


def get_order_manager() -> OrderConnectionManager:
    global _order_manager
    if _order_manager is None:
        _order_manager = OrderConnectionManager()
    return _order_manager


def set_order_manager(mgr: OrderConnectionManager) -> None:
    global _order_manager
    _order_manager = mgr


def get_portfolio_manager() -> PortfolioConnectionManager:
    global _portfolio_manager
    if _portfolio_manager is None:
        _portfolio_manager = PortfolioConnectionManager()
    return _portfolio_manager


def set_portfolio_manager(mgr: PortfolioConnectionManager) -> None:
    global _portfolio_manager
    _portfolio_manager = mgr


@ws_router.websocket("/ws/market")
async def market_ws(ws: WebSocket):
    manager = get_manager()
    await manager.connect(ws)
    try:
        await ws.send_text(json.dumps({
            "type": "connected",
            "message": "subscribe to symbols to receive market data",
        }))
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await ws.send_text(json.dumps({
                    "type": "error", "message": "invalid json",
                }))
                continue
            action = msg.get("action")
            symbols = msg.get("symbols", [])
            if not isinstance(symbols, list):
                await ws.send_text(json.dumps({
                    "type": "error", "message": "symbols must be a list",
                }))
                continue
            if action == "subscribe":
                current = await manager.subscribe(ws, symbols)
                await ws.send_text(json.dumps({
                    "type": "subscribed", "symbols": sorted(current),
                }))
            elif action == "unsubscribe":
                current = await manager.unsubscribe(ws, symbols)
                await ws.send_text(json.dumps({
                    "type": "unsubscribed", "symbols": sorted(current),
                }))
            else:
                await ws.send_text(json.dumps({
                    "type": "error",
                    "message": f"unknown action: {action}",
                }))
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("websocket handler error")
    finally:
        await manager.disconnect(ws)


@ws_router.websocket("/ws/orders")
async def orders_ws(ws: WebSocket):
    manager = get_order_manager()
    await manager.connect(ws)
    try:
        await ws.send_text(json.dumps({
            "type": "connected",
            "message": "subscribe to portfolio_ids to receive order updates",
        }))
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await ws.send_text(json.dumps({
                    "type": "error", "message": "invalid json",
                }))
                continue
            action = msg.get("action")
            portfolio_ids = msg.get("portfolio_ids", [])
            if not isinstance(portfolio_ids, list):
                await ws.send_text(json.dumps({
                    "type": "error", "message": "portfolio_ids must be a list",
                }))
                continue
            if action == "subscribe":
                current = await manager.subscribe(ws, portfolio_ids)
                await ws.send_text(json.dumps({
                    "type": "subscribed", "portfolio_ids": sorted(current),
                }))
            elif action == "unsubscribe":
                current = await manager.unsubscribe(ws, portfolio_ids)
                await ws.send_text(json.dumps({
                    "type": "unsubscribed", "portfolio_ids": sorted(current),
                }))
            else:
                await ws.send_text(json.dumps({
                    "type": "error",
                    "message": f"unknown action: {action}",
                }))
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("orders websocket handler error")
    finally:
        await manager.disconnect(ws)


@ws_router.websocket("/ws/portfolio")
async def portfolio_ws(ws: WebSocket):
    manager = get_portfolio_manager()
    await manager.connect(ws)
    try:
        await ws.send_text(json.dumps({
            "type": "connected",
            "message": "subscribe to portfolio_ids to receive portfolio updates",
        }))
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await ws.send_text(json.dumps({
                    "type": "error", "message": "invalid json",
                }))
                continue
            action = msg.get("action")
            portfolio_ids = msg.get("portfolio_ids", [])
            if not isinstance(portfolio_ids, list):
                await ws.send_text(json.dumps({
                    "type": "error", "message": "portfolio_ids must be a list",
                }))
                continue
            if action == "subscribe":
                current = await manager.subscribe(ws, portfolio_ids)
                await ws.send_text(json.dumps({
                    "type": "subscribed", "portfolio_ids": sorted(current),
                }))
            elif action == "unsubscribe":
                current = await manager.unsubscribe(ws, portfolio_ids)
                await ws.send_text(json.dumps({
                    "type": "unsubscribed", "portfolio_ids": sorted(current),
                }))
            else:
                await ws.send_text(json.dumps({
                    "type": "error",
                    "message": f"unknown action: {action}",
                }))
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("portfolio websocket handler error")
    finally:
        await manager.disconnect(ws)
