"""Microbenchmarks for isolated OrderBook operations.

Tests individual methods: add(), cancel(), _pop_best_order(), depth(),
and a multi-price-level insertion scenario.

Usage:
    python -m benchmarks.bench_orderbook
    python -m benchmarks.bench_orderbook --iterations 20000
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
from common.database.models import OrderSide, TimeInForce, OrderType
from orders.book_types import BookOrder
from orders.orderbook import OrderBook

SYMBOL = "BENCH"
BASE_PRICE = Decimal("100.00")
TICK = Decimal("0.01")


def _make_order(
    side: OrderSide, price: Decimal, qty: Decimal = Decimal("10"),
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


def _run_bench(name: str, setup_fn, bench_fn, iterations: int) -> dict:
    """Generic harness: setup once, time bench_fn per iteration."""
    ctx = setup_fn(iterations)
    tracemalloc.start()
    mem_before = tracemalloc.get_traced_memory()[0]
    latencies_ns: list[int] = []
    t_start = time.perf_counter_ns()
    for i in range(iterations):
        t0 = time.perf_counter_ns()
        bench_fn(ctx, i)
        latencies_ns.append(time.perf_counter_ns() - t0)
    elapsed_ns = time.perf_counter_ns() - t_start
    mem_after = tracemalloc.get_traced_memory()[0]
    tracemalloc.stop()
    elapsed_s = elapsed_ns / 1e9
    throughput = iterations / elapsed_s if elapsed_s > 0 else 0
    latencies_us = [ns / 1000 for ns in latencies_ns]
    return {
        "name": name,
        "iterations": iterations,
        "elapsed_s": round(elapsed_s, 4),
        "throughput_ops": round(throughput, 1),
        "p50_us": round(statistics.median(latencies_us), 2),
        "p95_us": round(statistics.quantiles(latencies_us, n=20)[18], 2),
        "p99_us": round(statistics.quantiles(latencies_us, n=100)[98], 2),
        "min_us": round(min(latencies_us), 2),
        "max_us": round(max(latencies_us), 2),
        "mem_delta_kb": round((mem_after - mem_before) / 1024, 1),
    }


# ------------------------------------------------------------------
# Benchmark: add() — single price level
# ------------------------------------------------------------------

def _setup_add_single(n: int) -> dict:
    return {
        "book": OrderBook(SYMBOL),
        "orders": [_make_order(OrderSide.BUY, BASE_PRICE) for _ in range(n)],
    }

def _bench_add_single(ctx: dict, i: int) -> None:
    ctx["book"].add(ctx["orders"][i])


# ------------------------------------------------------------------
# Benchmark: add() — multi price level (spread across 500 ticks)
# ------------------------------------------------------------------

def _setup_add_multi(n: int) -> dict:
    orders = [
        _make_order(OrderSide.BUY, BASE_PRICE + TICK * (i % 500))
        for i in range(n)
    ]
    return {"book": OrderBook(SYMBOL), "orders": orders}

def _bench_add_multi(ctx: dict, i: int) -> None:
    ctx["book"].add(ctx["orders"][i])


# ------------------------------------------------------------------
# Benchmark: cancel()
# ------------------------------------------------------------------

def _setup_cancel(n: int) -> dict:
    book = OrderBook(SYMBOL)
    orders = [_make_order(OrderSide.BUY, BASE_PRICE + TICK * (i % 200)) for i in range(n)]
    for o in orders:
        book.add(o)
    return {"book": book, "order_ids": [o.order_id for o in orders]}

def _bench_cancel(ctx: dict, i: int) -> None:
    ctx["book"].cancel(ctx["order_ids"][i])


# ------------------------------------------------------------------
# Benchmark: _pop_best_order()
# ------------------------------------------------------------------

def _setup_pop_best(n: int) -> dict:
    book = OrderBook(SYMBOL)
    for i in range(n):
        book.add(_make_order(OrderSide.BUY, BASE_PRICE + TICK * (i % 300)))
    return {"book": book}

def _bench_pop_best(ctx: dict, _i: int) -> None:
    ctx["book"]._pop_best_order(OrderSide.BUY)


# ------------------------------------------------------------------
# Benchmark: depth()
# ------------------------------------------------------------------

def _setup_depth(n: int) -> dict:
    book = OrderBook(SYMBOL)
    for i in range(min(n, 5000)):
        book.add(_make_order(OrderSide.SELL, BASE_PRICE + TICK * (i % 200)))
    return {"book": book}

def _bench_depth(ctx: dict, _i: int) -> None:
    ctx["book"].depth(OrderSide.SELL, levels=10)


def _print_table(results: list[dict]) -> None:
    header = (
        f"{'Benchmark':<22} {'Iters':>7} {'Elapsed':>8} "
        f"{'Ops/sec':>10} {'p50':>8} {'p95':>8} {'p99':>8} "
        f"{'Min':>8} {'Max':>8} {'Mem Δ':>8}"
    )
    print("\n" + "=" * len(header))
    print("OrderBook Microbenchmarks")
    print("=" * len(header))
    print(header)
    print("-" * len(header))
    for r in results:
        print(
            f"{r['name']:<22} {r['iterations']:>7} {r['elapsed_s']:>7.3f}s "
            f"{r['throughput_ops']:>10.1f} {r['p50_us']:>7.1f}µ {r['p95_us']:>7.1f}µ "
            f"{r['p99_us']:>7.1f}µ {r['min_us']:>7.1f}µ {r['max_us']:>7.1f}µ "
            f"{r['mem_delta_kb']:>7.1f}K"
        )
    print("=" * len(header))
    print("(µ = microseconds, K = kilobytes)\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="OrderBook microbenchmarks")
    parser.add_argument("--iterations", type=int, default=10_000, help="iterations per bench")
    args = parser.parse_args()
    n = args.iterations
    results = [
        _run_bench("add_single_level", _setup_add_single, _bench_add_single, n),
        _run_bench("add_multi_level", _setup_add_multi, _bench_add_multi, n),
        _run_bench("cancel", _setup_cancel, _bench_cancel, n),
        _run_bench("pop_best_order", _setup_pop_best, _bench_pop_best, n),
        _run_bench("depth_10_levels", _setup_depth, _bench_depth, n),
    ]
    _print_table(results)


if __name__ == "__main__":
    main()
