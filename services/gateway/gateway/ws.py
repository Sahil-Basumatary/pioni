import asyncio
import json
import logging
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
        msg = json.dumps({"type": "trade", "symbol": symbol, "data": data})
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


_manager: ConnectionManager | None = None


def get_manager() -> ConnectionManager:
    global _manager
    if _manager is None:
        _manager = ConnectionManager()
    return _manager


def set_manager(mgr: ConnectionManager) -> None:
    global _manager
    _manager = mgr


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
