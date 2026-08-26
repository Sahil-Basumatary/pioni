"""Profiling entrypoint for the matching engine.

Runs a realistic mixed workload designed for profiler attachment:
  - py-spy:   py-spy record -o profile.svg -- python -m benchmarks.profile_runner
  - cProfile: python -m cProfile -o profile.prof -m benchmarks.profile_runner
  - snakeviz:  snakeviz profile.prof

The workload mixes limit resting, market sweeps, and cancels to
exercise all hot code paths.

Usage:
    python -m benchmarks.profile_runner
    python -m benchmarks.profile_runner --rounds 5 --orders-per-round 5000
"""
from __future__ import annotations
import argparse
import sys
import time
import uuid
from datetime import datetime, timezone
from decimal import Decimal
sys.path.insert(0, ".")
from common.database.models import OrderSide, OrderType, TimeInForce
from orders.book_types import BookOrder
from orders.engine import MatchingEngine

SYMBOL = "PROF"
BASE_PRICE = Decimal("100.00")
TICK = Decimal("0.01")


def _limit(side: OrderSide, price: Decimal, qty: Decimal) -> BookOrder:
    return BookOrder(
        order_id=uuid.uuid4(),
        symbol=SYMBOL,
        side=side,
        order_type=OrderType.LIMIT,
        price=price,
        quantity=qty,
        remaining=qty,
        timestamp=datetime.now(timezone.utc),
        time_in_force=TimeInForce.GTC,
    )


def _market(side: OrderSide, qty: Decimal) -> BookOrder:
    return BookOrder(
        order_id=uuid.uuid4(),
        symbol=SYMBOL,
        side=side,
        order_type=OrderType.MARKET,
        price=Decimal("0"),
        quantity=qty,
        remaining=qty,
        timestamp=datetime.now(timezone.utc),
    )


def run_workload(rounds: int, orders_per_round: int) -> None:
    """Mixed workload: seed limits, sweep with markets, cancel stragglers."""
    engine = MatchingEngine(SYMBOL)
    total_ops = 0
    for _ in range(rounds):
        resting_ids: list[uuid.UUID] = []
        for i in range(orders_per_round):
            price = BASE_PRICE + TICK * (i % 200)
            order = _limit(OrderSide.SELL, price, Decimal("10"))
            engine.submit(order)
            resting_ids.append(order.order_id)
            total_ops += 1
        sweep_count = orders_per_round // 2
        for _ in range(sweep_count):
            engine.submit(_market(OrderSide.BUY, Decimal("3")))
            total_ops += 1
        cancel_count = min(len(resting_ids) // 4, orders_per_round // 4)
        for j in range(cancel_count):
            engine.cancel(resting_ids[j])
            total_ops += 1
        bid_count = orders_per_round // 5
        for i in range(bid_count):
            price = BASE_PRICE - TICK * (i % 100)
            engine.submit(_limit(OrderSide.BUY, price, Decimal("5")))
            total_ops += 1
    return total_ops


def main() -> None:
    parser = argparse.ArgumentParser(description="Profile runner for matching engine")
    parser.add_argument("--rounds", type=int, default=3, help="number of workload rounds")
    parser.add_argument(
        "--orders-per-round", type=int, default=5000,
        help="orders seeded per round",
    )
    args = parser.parse_args()
    print(f"Running profiling workload: {args.rounds} rounds x {args.orders_per_round} orders")
    print("Attach your profiler now (or run via py-spy / cProfile).\n")
    t0 = time.perf_counter()
    total_ops = run_workload(args.rounds, args.orders_per_round)
    elapsed = time.perf_counter() - t0
    print(f"Completed {total_ops:,} operations in {elapsed:.3f}s")
    print(f"Throughput: {total_ops / elapsed:,.0f} ops/sec")
    print("\nTo profile:")
    print("  py-spy:    py-spy record -o profile.svg -- python -m benchmarks.profile_runner")
    print("  cProfile:  python -m cProfile -o profile.prof -m benchmarks.profile_runner")
    print("  snakeviz:  snakeviz profile.prof")


if __name__ == "__main__":
    main()
