"""End-to-end matching engine throughput and latency benchmarks.

Seeds resting limit orders on one side, then fires market orders
against them. Measures orders/sec and latency percentiles.

Usage:
    python -m benchmarks.bench_engine
    python -m benchmarks.bench_engine --orders 50000
"""
from __future__ import annotations
import argparse
import statistics
import sys
import time
import tracemalloc
import uuid
from datetime import datetime, timezone
from decimal import Decimal
sys.path.insert(0, ".")
from common.database.models import OrderSide, OrderType, TimeInForce
from orders.book_types import BookOrder
from orders.engine import MatchingEngine

SYMBOL = "BENCH"
BASE_PRICE = Decimal("100.00")
TICK = Decimal("0.01")


def _make_limit(
    side: OrderSide, price: Decimal, qty: Decimal,
) -> BookOrder:
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


def _make_market(side: OrderSide, qty: Decimal) -> BookOrder:
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


def _seed_book(engine: MatchingEngine, n_orders: int) -> None:
    """Place resting ask orders across multiple price levels."""
    for i in range(n_orders):
        price = BASE_PRICE + TICK * (i % 100)
        engine.submit(_make_limit(OrderSide.SELL, price, Decimal("10")))


def bench_market_sweep(n_orders: int, seed_orders: int) -> dict:
    """Fire n_orders market buys against a pre-seeded ask side."""
    engine = MatchingEngine(SYMBOL)
    _seed_book(engine, seed_orders)
    qty = Decimal("1")
    orders = [_make_market(OrderSide.BUY, qty) for _ in range(n_orders)]
    tracemalloc.start()
    mem_before = tracemalloc.get_traced_memory()[0]
    latencies_ns: list[int] = []
    t_start = time.perf_counter_ns()
    for order in orders:
        t0 = time.perf_counter_ns()
        engine.submit(order)
        latencies_ns.append(time.perf_counter_ns() - t0)
    elapsed_ns = time.perf_counter_ns() - t_start
    mem_after = tracemalloc.get_traced_memory()[0]
    tracemalloc.stop()
    elapsed_s = elapsed_ns / 1e9
    throughput = n_orders / elapsed_s if elapsed_s > 0 else 0
    latencies_us = [ns / 1000 for ns in latencies_ns]
    return {
        "name": "market_sweep",
        "orders": n_orders,
        "elapsed_s": round(elapsed_s, 4),
        "throughput_ops": round(throughput, 1),
        "p50_us": round(statistics.median(latencies_us), 2),
        "p95_us": round(statistics.quantiles(latencies_us, n=20)[18], 2),
        "p99_us": round(statistics.quantiles(latencies_us, n=100)[98], 2),
        "min_us": round(min(latencies_us), 2),
        "max_us": round(max(latencies_us), 2),
        "mem_delta_kb": round((mem_after - mem_before) / 1024, 1),
    }


def bench_limit_insert_match(n_orders: int) -> dict:
    """Alternating buy/sell limit orders that cross and fill immediately."""
    engine = MatchingEngine(SYMBOL)
    qty = Decimal("5")
    orders: list[BookOrder] = []
    for i in range(n_orders):
        if i % 2 == 0:
            orders.append(_make_limit(OrderSide.SELL, BASE_PRICE, qty))
        else:
            orders.append(_make_limit(OrderSide.BUY, BASE_PRICE, qty))
    tracemalloc.start()
    mem_before = tracemalloc.get_traced_memory()[0]
    latencies_ns: list[int] = []
    t_start = time.perf_counter_ns()
    for order in orders:
        t0 = time.perf_counter_ns()
        engine.submit(order)
        latencies_ns.append(time.perf_counter_ns() - t0)
    elapsed_ns = time.perf_counter_ns() - t_start
    mem_after = tracemalloc.get_traced_memory()[0]
    tracemalloc.stop()
    elapsed_s = elapsed_ns / 1e9
    throughput = n_orders / elapsed_s if elapsed_s > 0 else 0
    latencies_us = [ns / 1000 for ns in latencies_ns]
    return {
        "name": "limit_insert_match",
        "orders": n_orders,
        "elapsed_s": round(elapsed_s, 4),
        "throughput_ops": round(throughput, 1),
        "p50_us": round(statistics.median(latencies_us), 2),
        "p95_us": round(statistics.quantiles(latencies_us, n=20)[18], 2),
        "p99_us": round(statistics.quantiles(latencies_us, n=100)[98], 2),
        "min_us": round(min(latencies_us), 2),
        "max_us": round(max(latencies_us), 2),
        "mem_delta_kb": round((mem_after - mem_before) / 1024, 1),
    }


def bench_limit_no_match(n_orders: int) -> dict:
    """Insert limit orders that never cross — pure book insertion cost."""
    engine = MatchingEngine(SYMBOL)
    qty = Decimal("10")
    orders: list[BookOrder] = []
    for i in range(n_orders):
        price = BASE_PRICE + TICK * i
        orders.append(_make_limit(OrderSide.BUY, price, qty))
    tracemalloc.start()
    mem_before = tracemalloc.get_traced_memory()[0]
    latencies_ns: list[int] = []
    t_start = time.perf_counter_ns()
    for order in orders:
        t0 = time.perf_counter_ns()
        engine.submit(order)
        latencies_ns.append(time.perf_counter_ns() - t0)
    elapsed_ns = time.perf_counter_ns() - t_start
    mem_after = tracemalloc.get_traced_memory()[0]
    tracemalloc.stop()
    elapsed_s = elapsed_ns / 1e9
    throughput = n_orders / elapsed_s if elapsed_s > 0 else 0
    latencies_us = [ns / 1000 for ns in latencies_ns]
    return {
        "name": "limit_no_match",
        "orders": n_orders,
        "elapsed_s": round(elapsed_s, 4),
        "throughput_ops": round(throughput, 1),
        "p50_us": round(statistics.median(latencies_us), 2),
        "p95_us": round(statistics.quantiles(latencies_us, n=20)[18], 2),
        "p99_us": round(statistics.quantiles(latencies_us, n=100)[98], 2),
        "min_us": round(min(latencies_us), 2),
        "max_us": round(max(latencies_us), 2),
        "mem_delta_kb": round((mem_after - mem_before) / 1024, 1),
    }


def _print_table(results: list[dict]) -> None:
    header = (
        f"{'Benchmark':<22} {'Orders':>7} {'Elapsed':>8} "
        f"{'Ops/sec':>10} {'p50':>8} {'p95':>8} {'p99':>8} "
        f"{'Min':>8} {'Max':>8} {'Mem Δ':>8}"
    )
    print("\n" + "=" * len(header))
    print("Matching Engine Benchmarks")
    print("=" * len(header))
    print(header)
    print("-" * len(header))
    for r in results:
        print(
            f"{r['name']:<22} {r['orders']:>7} {r['elapsed_s']:>7.3f}s "
            f"{r['throughput_ops']:>10.1f} {r['p50_us']:>7.1f}µ {r['p95_us']:>7.1f}µ "
            f"{r['p99_us']:>7.1f}µ {r['min_us']:>7.1f}µ {r['max_us']:>7.1f}µ "
            f"{r['mem_delta_kb']:>7.1f}K"
        )
    print("=" * len(header))
    print("(µ = microseconds, K = kilobytes)\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="Matching engine benchmarks")
    parser.add_argument("--orders", type=int, default=10_000, help="orders per benchmark")
    parser.add_argument("--seed", type=int, default=5_000, help="resting orders for sweep")
    args = parser.parse_args()
    n = args.orders
    results = [
        bench_market_sweep(n, seed_orders=args.seed),
        bench_limit_insert_match(n),
        bench_limit_no_match(n),
    ]
    _print_table(results)


if __name__ == "__main__":
    main()
