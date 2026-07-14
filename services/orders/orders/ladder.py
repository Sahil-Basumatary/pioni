from __future__ import annotations
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP


@dataclass(frozen=True)
class LadderLevel:
    side: str
    price: Decimal
    quantity: Decimal


def _quantize_price(price: Decimal) -> Decimal:
    return price.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _quantize_qty(qty: Decimal) -> Decimal:
    return qty.quantize(Decimal("0.00000001"), rounding=ROUND_HALF_UP)


def build_ladder(
    mid: Decimal,
    *,
    levels: int,
    spread_bps: Decimal,
    notional_usd: Decimal,
) -> list[LadderLevel]:
    if mid <= 0 or levels < 1 or notional_usd <= 0:
        return []
    step = mid * (spread_bps / Decimal("10000"))
    if step <= 0:
        step = Decimal("0.01")
    qty = _quantize_qty(notional_usd / mid)
    if qty <= 0:
        return []
    out: list[LadderLevel] = []
    for i in range(1, levels + 1):
        bid = _quantize_price(mid - (step * i))
        ask = _quantize_price(mid + (step * i))
        if bid > 0:
            out.append(LadderLevel(side="BUY", price=bid, quantity=qty))
        if ask > 0:
            out.append(LadderLevel(side="SELL", price=ask, quantity=qty))
    return out


def price_moved_enough(
    previous: Decimal | None,
    current: Decimal,
    move_bps: Decimal,
) -> bool:
    if previous is None or previous <= 0:
        return True
    change = abs(current - previous) / previous * Decimal("10000")
    return change >= move_bps
