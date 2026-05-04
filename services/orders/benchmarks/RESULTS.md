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

The first thing that jumped out: matching is where the cost lives. Pure
limit orders that never cross hit ~58K ops/sec. Market sweeps that trigger
fills drop to ~42K. That's a 28% tax just for filling an order.

I ran py-spy on a 50K market sweep and the flame graph made it obvious:

1. **Pydantic `Fill` construction** — We were building a frozen BaseModel with
   full schema validation on every single fill. 10K sweeps means 10K Pydantic
   validations inside the tight loop. This was the worst offender.

2. **`datetime.now(timezone.utc)` per fill** — A syscall per iteration. Completely
   redundant when you're filling multiple levels in one pass.

3. **Repeated attribute lookups** — `self._book._side_book(opposite)` called
   every iteration. `order.remaining` going through Pydantic descriptors each
   time. Classic Python overhead that's invisible until you profile.

4. **`abs(key)` on ask prices** — Ask keys are already positive. Minor, but it
   runs on every iteration and it adds up.

The OrderBook itself was fine. `add()` and `cancel()` at ~190K ops/sec,
`pop_best_order()` at 252K. `SortedDict` with `deque` per level is
well-suited here. `depth()` is slow at ~5.9K but it's not in the match path
so I left it alone.

---

## Pass 1: Match Loop (2026-04-24)

Targeted the hot path inside `_match()`:
- Replaced Pydantic `Fill` with a `_FastFill` __slots__ class
- Batched `datetime.now(timezone.utc)` — one call per match instead of one per fill
- Hoisted `side_book`, `remaining`, `taker_id`, `orders_map`, `is_buy` out of the loop
- Inlined `peekitem(0)` + queue manipulation (eliminated `_pop_best_order()` call overhead)

| Benchmark | Orders | Ops/sec | p50 (µs) | p95 (µs) | p99 (µs) | Min (µs) | Max (µs) | Mem Δ (KB) |
|---|---|---|---|---|---|---|---|---|
| market_sweep | 10,000 | ~46,490 | 19.1 | 23.8 | 39.3 | 18.1 | 156.5 | 1,373 |
| limit_insert_match | 10,000 | ~56,074 | 20.1 | 22.8 | 37.6 | 9.7 | 268.8 | 1,373 |
| limit_no_match | 10,000 | ~59,512 | 14.4 | 17.7 | 36.2 | 11.8 | 1,213 | 9,450 |

---

## Pass 2: Kill the Pydantic Tax (2026-05-03)

The match loop was fast now. The problem was everything around it:
- Replaced `OrderResult` (frozen Pydantic BaseModel) with `_FastResult` __slots__ class
- Converted `_FastFill` from __slots__ to `namedtuple` (C-level `tuple.__new__`)
- Replaced dict-literal dispatch in `submit()` with if/elif (LIMIT-first)
- Split the match loop: separate paths for market orders (no limit) and limit orders
- Replaced `min(a, b)` with inline if/else in the tight loop

### Engine Benchmarks (Final)

| Benchmark | Orders | Ops/sec | p50 (µs) | p95 (µs) | p99 (µs) | Min (µs) | Max (µs) | Mem Δ (KB) |
|---|---|---|---|---|---|---|---|---|
| market_sweep | 10,000 | **74,764** | 11.6 | 15.7 | 21.0 | 10.8 | 183.8 | 1,373 |
| limit_insert_match | 10,000 | **83,673** | 14.6 | 16.4 | 23.1 | 4.9 | 216.2 | 1,373 |
| limit_no_match | 10,000 | **91,493** | 8.8 | 11.8 | 27.5 | 6.9 | 1,100 | 9,450 |

---

## The Numbers

### Throughput (10K orders)

| Benchmark | Baseline | Pass 1 | **Final** | **Δ from baseline** |
|---|---|---|---|---|
| market_sweep | 42,100 | 46,490 | **74,764** | **+77.6%** |
| limit_insert_match | 50,800 | 56,074 | **83,673** | **+64.7%** |
| limit_no_match | 58,000 | 59,512 | **91,493** | **+57.7%** |

### Latency (10K, market_sweep)

| Percentile | Baseline | **Final** | **Δ** |
|---|---|---|---|
| p50 | 21.2 µs | 11.6 µs | **-45.3%** |
| p95 | 26.4 µs | 15.7 µs | **-40.5%** |
| p99 | 42.2 µs | 21.0 µs | **-50.2%** |

### Latency (10K, limit_insert_match)

| Percentile | Baseline | **Final** | **Δ** |
|---|---|---|---|
| p50 | 22.5 µs | 14.6 µs | **-35.1%** |
| p95 | 26.1 µs | 16.4 µs | **-37.2%** |
| p99 | 41.6 µs | 23.1 µs | **-44.5%** |

### Latency (10K, limit_no_match)

| Percentile | Baseline | **Final** | **Δ** |
|---|---|---|---|
| p50 | 14.6 µs | 8.8 µs | **-39.7%** |
| p95 | 18.5 µs | 11.8 µs | **-36.2%** |
| p99 | 34.3 µs | 27.5 µs | **-19.8%** |

---

## What Actually Moved the Needle

Two passes. **78% faster.** p50 latency nearly halved. The engine does
**74,700+ market orders/sec** with p99 under 21µs.

### Pass 1 gave us +10%. Felt good, wasn't enough.

The first pass was textbook: profile, find hot code, make it cheaper.

1. **`_FastFill` __slots__** — Stopped building Pydantic models inside the
   match loop. Obvious in retrospect.
2. **Timestamp batching** — One `datetime.now()` per match instead of one per fill.
3. **Local var caching** — Hoisted everything out of the while loop.

This was satisfying but the numbers barely moved. 42K to 46K. I was
measuring the loop but the real cost was elsewhere.

### Pass 2 gave us +60%. This is where it got interesting.

After pass 1, I stared at the numbers and asked: if the match loop is fast
now, where's the other 13µs going? The answer was embarrassing.

4. **`OrderResult` was a frozen Pydantic model.** Every. Single. Submit.
   Pydantic schema validation, type coercion, immutability setup — on every
   order that passed through the engine. This was costing ~5µs per operation
   and I hadn't noticed because it wasn't "in the match loop." It was the
   biggest single win.

5. **`_FastFill` → namedtuple** — `tuple.__new__` in C is faster than a
   Python `__init__` body. ~1µs per fill saved.

6. **if/elif dispatch** — `submit()` was creating a `{MARKET: fn, LIMIT: fn,
   STOP: fn}` dict literal on every call just to look up one key. Replaced
   with a branch. LIMIT first since it's the common case.

7. **Split the match loop** — Two loop bodies: one for market orders (no
   price limit), one for limit orders (with check). Removes a `None` check
   from every iteration.

8. **Inline min()** — `if a < b: x = a else: x = b` instead of `min(a, b)`.
   Avoids a function call in the tight loop.

### Why pass 2 was 6x bigger than pass 1

Pass 1 targeted code that runs 1-N times per order (the match loop). In the
benchmark, each market order fills exactly 1 resting order. So the loop runs
once. Optimizing inside the loop helped, but only for that one iteration.

Pass 2 targeted code that runs on **every single submit()** — result
construction, dispatch overhead. These were eating 8-10µs out of 19µs total.
More than half the budget, completely invisible until I looked outside the
match loop.

---

## The Thing That Didn't Work: Int Fixed-Point

I thought this would be the big win. Replace `Decimal` with `int` scaled by
10^8 — int comparisons are single CPU instructions, Decimal comparison is
multi-step. Should be faster.

It was 30-40% slower. I reverted it the same day.

| Benchmark | With Decimal | With int fixed-point | Δ |
|---|---|---|---|
| market_sweep | 46,490 | 25,554 | **-45%** |
| limit_insert_match | 56,074 | 34,408 | **-39%** |
| limit_no_match | 59,512 | 42,143 | **-29%** |

The mistake was assuming Python int operations are cheap. They're not —
Python `int` is a heap-allocated object. And `int(Decimal * scale)` at every
`add()` plus `Decimal(int) / scale` per fill in the loop costs more than
just doing the Decimal comparison directly.

CPython's `_decimal` module is already implemented in C. Its compare and
subtract are fast. The conversion overhead at the boundary dominates.

The lesson is simple: int fixed-point only wins when the entire pipeline is
int from the start. No conversion at boundaries. That means `BookOrder.price`
as `int` from creation — which means redesigning the domain model. Too
invasive for now. The Go rewrite (Phase 8) will use native `int64`
fixed-point end-to-end, no conversions.

---

## Where We Stand

We've squeezed about as much as Python will give us. What's left is:

- `SortedDict` operations (`peekitem`, `del`) — already C-optimized
- `Decimal` arithmetic — already C-optimized via `_decimal`
- CPython itself — bytecode dispatch, reference counting, the GIL

There's no clever trick that gets us another 2x in pure Python. The next
real jump is the Go rewrite (Phase 8): int64 fixed-point end-to-end, lock-free
structures, zero-allocation matching. That should put us comfortably in
the millions of ops/sec range.
