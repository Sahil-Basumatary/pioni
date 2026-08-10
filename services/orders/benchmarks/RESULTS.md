# Matching engine benchmarks

- Machine: M1 Pro, 16 GB memory
- Runtime: Python 3.12.1 on macOS
- Baseline date: 18 April 2026
- Final pass: 3 May 2026
- Method: three runs per benchmark

Engine runs use 10,000 orders unless marked as a 50,000-order stress run. The sweep benchmark starts with 5,000 resting orders.

## Baseline

### Engine

| Benchmark | Orders | Ops/sec | p50 (µs) | p95 (µs) | p99 (µs) | Min (µs) | Max (µs) | Memory (KB) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Market sweep | 10,000 | ~42,100 | 21.2 | 26.4 | 42.2 | 19.9 | 214.9 | 1,373 |
| Limit insert and match | 10,000 | ~50,800 | 22.5 | 26.1 | 41.6 | 10.3 | 320.1 | 1,373 |
| Limit without match | 10,000 | ~58,000 | 14.6 | 18.5 | 34.3 | 12.0 | 1,899 | 9,450 |

### Engine stress run

| Benchmark | Orders | Ops/sec | p50 (µs) | p95 (µs) | p99 (µs) | Min (µs) | Max (µs) | Memory (KB) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Market sweep | 50,000 | 42,563 | 21.0 | 26.1 | 41.5 | 19.9 | 475.1 | 6,881 |
| Limit insert and match | 50,000 | 50,357 | 23.0 | 26.2 | 39.6 | 10.6 | 418.1 | 6,881 |
| Limit without match | 50,000 | 56,343 | 15.0 | 19.2 | 38.4 | 12.0 | 1,955 | 49,504 |

### Order book

| Benchmark | Iterations | Ops/sec | p50 (µs) | p95 (µs) | p99 (µs) | Min (µs) | Max (µs) | Memory (KB) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Add at one level | 10,000 | 191,376 | 3.5 | 4.3 | 8.2 | 3.3 | 68.1 | 726 |
| Add across levels | 10,000 | 182,080 | 3.6 | 6.5 | 8.2 | 3.3 | 75.4 | 1,089 |
| Cancel | 10,000 | 189,709 | 3.5 | 6.2 | 8.5 | 3.1 | 86.6 | 357 |
| Pop best order | 10,000 | 252,023 | 2.3 | 4.0 | 6.7 | 1.8 | 48.4 | 357 |
| Read 10 depth levels | 10,000 | 5,873 | 162.8 | 197.0 | 260.8 | 158.2 | 500.6 | 359 |

The mixed workload completed 29,250 operations in 0.330 seconds: 88,755 operations per second.

## Profile findings

A 50,000-order `py-spy` run showed four costs on the matching path:

1. Pydantic validation for every fill
2. A new UTC timestamp for every fill
3. Repeated attribute and book lookups inside the loop
4. Work shared by market and limit orders despite their different checks

Order-book insertion, cancellation, and best-order removal were not the bottleneck.

## Pass 1: match loop

Changes:

- Replaced Pydantic fill objects with a slots-based internal result
- Reused one timestamp per match
- Moved stable lookups outside the loop
- Removed an internal call from each matched level

| Benchmark | Ops/sec | p50 (µs) | p95 (µs) | p99 (µs) | Min (µs) | Max (µs) | Memory (KB) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Market sweep | ~46,490 | 19.1 | 23.8 | 39.3 | 18.1 | 156.5 | 1,373 |
| Limit insert and match | ~56,074 | 20.1 | 22.8 | 37.6 | 9.7 | 268.8 | 1,373 |
| Limit without match | ~59,512 | 14.4 | 17.7 | 36.2 | 11.8 | 1,213 | 9,450 |

## Pass 2: submit path

Changes:

- Replaced the Pydantic order result with a slots-based internal result
- Switched fill values to `namedtuple`
- Replaced per-call dictionary dispatch with branches
- Split market and limit matching loops
- Removed `min()` calls from the hot loop

| Benchmark | Ops/sec | p50 (µs) | p95 (µs) | p99 (µs) | Min (µs) | Max (µs) | Memory (KB) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Market sweep | **74,764** | 11.6 | 15.7 | 21.0 | 10.8 | 183.8 | 1,373 |
| Limit insert and match | **83,673** | 14.6 | 16.4 | 23.1 | 4.9 | 216.2 | 1,373 |
| Limit without match | **91,493** | 8.8 | 11.8 | 27.5 | 6.9 | 1,100 | 9,450 |

## Change from baseline

| Benchmark | Baseline ops/sec | Final ops/sec | Throughput | p50 | p95 | p99 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Market sweep | 42,100 | 74,764 | +77.6% | -45.3% | -40.5% | -50.2% |
| Limit insert and match | 50,800 | 83,673 | +64.7% | -35.1% | -37.2% | -44.5% |
| Limit without match | 58,000 | 91,493 | +57.7% | -39.7% | -36.2% | -19.8% |

The second pass produced the larger gain because order-result construction and dispatch run once for every submission. Match-loop work only repeats when one order fills against several resting orders.

## Rejected fixed-point experiment

Converting `Decimal` prices to scaled Python integers slowed all three benchmarks:

| Benchmark | Decimal ops/sec | Fixed-point ops/sec | Change |
| --- | ---: | ---: | ---: |
| Market sweep | 46,490 | 25,554 | -45% |
| Limit insert and match | 56,074 | 34,408 | -39% |
| Limit without match | 59,512 | 42,143 | -29% |

Boundary conversion cost outweighed integer comparison gains. CPython's decimal operations already run in C, while each conversion created additional Python objects. The experiment was reverted.
