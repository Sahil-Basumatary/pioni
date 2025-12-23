import asyncio
import time
from datetime import datetime
import aiohttp
import pytest

TICKERS = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "AMD",
    "NFLX", "DIS", "BA", "JPM", "GS", "MS", "BAC", "WFC", "C",
]


async def _is_up(session: aiohttp.ClientSession, base_url: str) -> bool:
    try:
        async with session.get(f"{base_url}/health", timeout=aiohttp.ClientTimeout(total=2)) as resp:
            return resp.status == 200
    except Exception:
        return False


@pytest.fixture
async def session():
    async with aiohttp.ClientSession() as s:
        yield s


async def _test_ticker(session: aiohttp.ClientSession, ticker: str, base_url: str):
    try:
        start = time.time()
        async with session.get(f"{base_url}/sentiment/{ticker}") as resp:
            elapsed = time.time() - start
            if resp.status == 200:
                data = await resp.json()
                return {"ticker": ticker, "success": True, "status": resp.status, "time": elapsed, "sentiment": data.get("sentiment")}
            return {"ticker": ticker, "success": False, "status": resp.status, "time": elapsed, "error": f"HTTP {resp.status}"}
    except Exception as e:
        return {"ticker": ticker, "success": False, "status": 0, "time": 0, "error": str(e)}


@pytest.mark.asyncio
async def test_load_smoke(session):
    base_url = "http://127.0.0.1:8001"

    if not await _is_up(session, base_url):
        pytest.skip("API not running on http://127.0.0.1:8000 (start uvicorn to run load test).")

    concurrent = 10
    tickers = TICKERS

    print(f"\n{'='*60}")
    print(f"Load Test Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Testing {len(tickers)} tickers with concurrency={concurrent}")
    print(f"{'='*60}\n")

    results = []
    for i in range(0, len(tickers), concurrent):
        batch = tickers[i:i + concurrent]
        batch_results = await asyncio.gather(*[_test_ticker(session, t, base_url) for t in batch])
        results.extend(batch_results)

    successes = [r for r in results if r["success"]]
    failures = [r for r in results if not r["success"]]

    assert len(successes) > 0, f"All requests failed. Sample failure: {failures[:3]}"

    avg_ms = (sum(r["time"] for r in successes) / len(successes)) * 1000

    print(f"Successful: {len(successes)}/{len(results)}")
    print(f"Avg response time: {avg_ms:.1f}ms")
    assert avg_ms < 5000