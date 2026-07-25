from __future__ import annotations
import logging
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from common import get_db, OrderStatus
from orders.book_types import BookSnapshot
from orders.schemas import SubmitOrderRequest, OrderResponse, CancelOrderResponse
from orders.service import (
    get_order_service,
    OrderError,
    OrderNotFoundError,
    OrderNotCancellableError,
    PortfolioNotFoundError,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["orders"])


@router.post("/orders", response_model=OrderResponse, status_code=201)
async def submit_order(
    req: SubmitOrderRequest,
    session: AsyncSession = Depends(get_db),
):
    svc = get_order_service()
    try:
        return await svc.submit_order(req, session)
    except PortfolioNotFoundError as e:
        raise HTTPException(status_code=404, detail={"error": e.code, "message": e.message}) from None
    except OrderError as e:
        raise HTTPException(status_code=400, detail={"error": e.code, "message": e.message}) from None


@router.delete("/orders/{order_id}", response_model=CancelOrderResponse)
async def cancel_order(
    order_id: uuid.UUID,
    portfolio_id: uuid.UUID = Query(...),
    session: AsyncSession = Depends(get_db),
):
    svc = get_order_service()
    try:
        return await svc.cancel_order(order_id, portfolio_id, session)
    except OrderNotFoundError as e:
        raise HTTPException(status_code=404, detail={"error": e.code, "message": e.message}) from None
    except OrderNotCancellableError as e:
        raise HTTPException(status_code=409, detail={"error": e.code, "message": e.message}) from None
    except OrderError as e:
        raise HTTPException(status_code=400, detail={"error": e.code, "message": e.message}) from None


@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: uuid.UUID,
    portfolio_id: uuid.UUID = Query(...),
    session: AsyncSession = Depends(get_db),
):
    svc = get_order_service()
    try:
        return await svc.get_order(order_id, portfolio_id, session)
    except OrderNotFoundError as e:
        raise HTTPException(status_code=404, detail={"error": e.code, "message": e.message}) from None


@router.get("/orders", response_model=list[OrderResponse])
async def list_orders(
    portfolio_id: uuid.UUID = Query(...),
    symbol: str | None = Query(None),
    status: OrderStatus | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_db),
):
    svc = get_order_service()
    return await svc.list_orders(
        portfolio_id, session,
        symbol=symbol, status=status, limit=limit, offset=offset,
    )


@router.get("/orderbook/{symbol}", response_model=BookSnapshot)
async def get_orderbook(
    symbol: str,
    depth: int = Query(10, ge=1, le=50),
):
    svc = get_order_service()
    return svc.get_orderbook(symbol, depth)
