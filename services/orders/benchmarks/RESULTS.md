# Matching Engine Benchmark Results

**System:** Apple M1 Pro, 16GB RAM, Python 3.12.1, macOS
**Date:** 2026-04-18

---

## Baseline (Pre-Optimization)

All benchmarks run with default parameters (10,000 orders, 5,000 seed orders for sweep).
Results averaged across 3 consecutive runs.

### Engine Benchmarks

| Benchmark | Orders | Ops/sec | p50 (µs) | p95 (µs) | p99 (µs) | Min (µs) | Max (µs) | Mem Δ (KB) |
|---|---|---|---|---|---|---|---|---|
| market_sweep | 10,000 | ~42,100 | 21.2 | 26.4 | 42.2 | 19.9 | 214.9 | 1,373 |
| limit_insert_match | 10,000 | ~50,800 | 22.5 | 26.1 | 41.6 | 10.3 | 320.1 | 1,373 |
| limit_no_match | 10,000 | ~58,000 | 14.6 | 18.5 | 34.3 | 12.0 | 1,899 | 9,450 |

### Engine Benchmarks (50K stress)

| Benchmark | Orders | Ops/sec | p50 (µs) | p95 (µs) | p99 (µs) | Min (µs) | Max (µs) | Mem Δ (KB) |
|---|---|---|---|---|---|---|---|---|
| market_sweep | 50,000 | 42,563 | 21.0 | 26.1 | 41.5 | 19.9 | 475.1 | 6,881 |
| limit_insert_match | 50,000 | 50,357 | 23.0 | 26.2 | 39.6 | 10.6 | 418.1 | 6,881 |
| limit_no_match | 50,000 | 56,343 | 15.0 | 19.2 | 38.4 | 12.0 | 1,955 | 49,504 |

### OrderBook Microbenchmarks

| Benchmark | Iters | Ops/sec | p50 (µs) | p95 (µs) | p99 (µs) | Min (µs) | Max (µs) | Mem Δ (KB) |
|---|---|---|---|---|---|---|---|---|
| add_single_level | 10,000 | 191,376 | 3.5 | 4.3 | 8.2 | 3.3 | 68.1 | 726 |
| add_multi_level | 10,000 | 182,080 | 3.6 | 6.5 | 8.2 | 3.3 | 75.4 | 1,089 |
| cancel | 10,000 | 189,709 | 3.5 | 6.2 | 8.5 | 3.1 | 86.6 | 357 |
| pop_best_order | 10,000 | 252,023 | 2.3 | 4.0 | 6.7 | 1.8 | 48.4 | 357 |
| depth_10_levels | 10,000 | 5,873 | 162.8 | 197.0 | 260.8 | 158.2 | 500.6 | 359 |

### Mixed Workload (profile_runner)

```
3 rounds x 5,000 orders/round
29,250 total operations in 0.330s
Throughput: 88,755 ops/sec
```

---

## Analysis

### Where Time Goes

The engine throughput is dominated by **matching cost**, not book insertion.
Pure limit insertions (no match) hit ~58K ops/sec, while market sweeps that
trigger fills drop to ~42K ops/sec — a 28% overhead per matched order.

Key bottlenecks visible in the hot path (`engine.py::_match`):

1. **Pydantic `Fill` construction** — Each fill creates a frozen `BaseModel` with
   full schema validation. `Fill(...)` dominates per-fill cost. At 10K market
   sweeps producing 10K fills, this validation runs 10K times in the tight loop.

2. **`datetime.now(timezone.utc)` per fill** — Syscall on every iteration of the
   match loop. Redundant when multiple fills happen in a single `_match()` pass.

3. **Repeated attribute lookups** — `self._book._side_book(opposite)` is called
   every iteration; `order.remaining` and `order.side` go through Pydantic
   descriptors each time.

4. **`abs(key)` on ask prices** — Ask keys are already positive (no negation), so
   `abs()` is a no-op. Minor but runs on every iteration.

### OrderBook Observations

- `add()` and `cancel()` are already fast (~190K ops/sec). `SortedDict` with
  `deque` per level is well-suited for this workload.
- `depth()` is the slowest operation at ~5.9K ops/sec due to iterating and
  summing `remaining` across all orders in each level's deque. Not in the match
  hot path, so lower priority.
- `pop_best_order()` at 252K ops/sec is the fastest — good since the match loop
  effectively does a pop on each consumed resting order.

---

## Post-Optimization

_To be filled after optimization pass._
