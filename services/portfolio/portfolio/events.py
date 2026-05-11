from __future__ import annotations
import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from common import OrderSide


class TradeExecutedEvent(BaseModel):
    # Mirrors orders.events.TradeExecuted wire format. Redefined here so portfolio service
    # has no compile-time dependency on orders service internals — only the message contract.
    model_config = ConfigDict(frozen=True)
    event_id: uuid.UUID
    timestamp: datetime
    trade_id: uuid.UUID
    order_id: uuid.UUID
    portfolio_id: uuid.UUID
    symbol: str
    side: OrderSide
    quantity: Decimal
    price: Decimal
    fee: Decimal = Decimal("0")
    maker_order_id: uuid.UUID
    taker_order_id: uuid.UUID
