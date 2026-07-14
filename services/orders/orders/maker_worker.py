from __future__ import annotations
import asyncio
import logging
from decimal import Decimal
import httpx
import redis.asyncio as aioredis
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession
from common import MarketSubscriber, OrderSide, OrderType, OrderStatus, TimeInForce
from orders.ladder import LadderLevel, build_ladder, price_moved_enough
from orders.schemas import SubmitOrderRequest
from orders.service import OrderService, OrderError
import orders.settings as settings

logger = logging.getLogger(__name__)


class LiquidityMaker:
    def __init__(
        self,
        *,
        service: OrderService,
        session_factory: async_sessionmaker[AsyncSession],
        redis: aioredis.Redis,
        portfolio_id,
    ) -> None:
        self._service = service
        self._session_factory = session_factory
        self._redis = redis
        self._portfolio_id = portfolio_id
        self._last_mid: dict[str, Decimal] = {}
        self._locks: dict[str, asyncio.Lock] = {}
        self._subscriber: MarketSubscriber | None = None
        self._poll_task: asyncio.Task | None = None
        self._running = False

    def _lock(self, symbol: str) -> asyncio.Lock:
        if symbol not in self._locks:
            self._locks[symbol] = asyncio.Lock()
        return self._locks[symbol]

    async def start(self) -> None:
        if self._running:
            return
        self._running = True
        self._subscriber = MarketSubscriber(redis=self._redis, on_trade=self._on_trade)
        await self._subscriber.start()
        self._poll_task = asyncio.create_task(self._poll_loop())
        logger.info(
            "liquidity maker started",
            extra={
                "symbols": settings.trading_symbols(),
                "levels": settings.maker_levels(),
            },
        )

    async def stop(self) -> None:
        self._running = False
        if self._subscriber:
            await self._subscriber.stop()
            self._subscriber = None
        if self._poll_task:
            self._poll_task.cancel()
            try:
                await self._poll_task
            except asyncio.CancelledError:
                pass
            self._poll_task = None

    async def _on_trade(self, symbol: str, data: dict) -> None:
        try:
            price = Decimal(str(data.get("price", "")))
        except Exception:
            return
        if price <= 0:
            return
        await self._maybe_rebalance(symbol.upper(), price)

    async def _poll_loop(self) -> None:
        interval = settings.maker_rebalance_interval_s()
        while self._running:
            try:
                for symbol in settings.trading_symbols():
                    mid = await self._fetch_http_mid(symbol)
                    if mid is not None:
                        await self._maybe_rebalance(symbol, mid)
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception("maker poll loop error")
            await asyncio.sleep(interval)

    async def _fetch_http_mid(self, symbol: str) -> Decimal | None:
        url = f"{settings.market_data_service_url()}/prices/{symbol}"
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                resp = await client.get(url)
            if resp.status_code != 200:
                return None
            price = Decimal(str(resp.json().get("price", "")))
            return price if price > 0 else None
        except Exception:
            return None

    async def _maybe_rebalance(self, symbol: str, mid: Decimal) -> None:
        async with self._lock(symbol):
            if not price_moved_enough(
                self._last_mid.get(symbol), mid, settings.maker_move_bps(),
            ):
                return
            ladder = build_ladder(
                mid,
                levels=settings.maker_levels(),
                spread_bps=settings.maker_spread_bps(),
                notional_usd=settings.maker_notional_usd(),
            )
            if not ladder:
                return
            try:
                await self._replace_ladder(symbol, ladder)
                self._last_mid[symbol] = mid
            except Exception:
                logger.exception(
                    "failed to rebalance maker book",
                    extra={"symbol": symbol, "mid": str(mid)},
                )

    async def _replace_ladder(self, symbol: str, ladder: list[LadderLevel]) -> None:
        async with self._session_factory() as session:
            await self._cancel_open(session, symbol)
            for level in ladder:
                req = SubmitOrderRequest(
                    portfolio_id=self._portfolio_id,
                    symbol=symbol,
                    side=OrderSide.BUY if level.side == "BUY" else OrderSide.SELL,
                    order_type=OrderType.LIMIT,
                    time_in_force=TimeInForce.GTC,
                    quantity=level.quantity,
                    price=level.price,
                )
                try:
                    await self._service.submit_order(req, session)
                except OrderError as exc:
                    logger.warning(
                        "maker level rejected",
                        extra={
                            "symbol": symbol,
                            "side": level.side,
                            "price": str(level.price),
                            "code": exc.code,
                            "message": exc.message,
                        },
                    )
            await session.commit()

    async def _cancel_open(self, session: AsyncSession, symbol: str) -> None:
        open_orders = await self._service.list_orders(
            self._portfolio_id,
            session,
            symbol=symbol,
            status=OrderStatus.OPEN,
            limit=100,
        )
        partial = await self._service.list_orders(
            self._portfolio_id,
            session,
            symbol=symbol,
            status=OrderStatus.PARTIALLY_FILLED,
            limit=100,
        )
        for order in [*open_orders, *partial]:
            try:
                await self._service.cancel_order(
                    order.id, self._portfolio_id, session,
                )
            except OrderError:
                continue
