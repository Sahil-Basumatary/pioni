import asyncio
import aiohttp
import time
from datetime import datetime

TICKERS = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "AMD",
    "NFLX", "DIS", "BA", "JPM", "GS", "MS", "BAC", "WFC", "C",
    "V", "MA", "PYPL", "SQ", "ADBE", "CRM", "ORCL", "IBM", "CSCO",
    "INTC", "QCOM", "TXN", "AVGO", "MU", "SNOW", "PLTR", "COIN",
    "UBER", "LYFT", "ABNB", "DASH", "SHOP", "SQ", "HOOD", "SOFI",
    "NIO", "RIVN", "LCID", "F", "GM", "TSLA", "TM", "HMC",
    "KO", "PEP", "MCD", "SBUX", "CMG", "YUM", "DPZ", "WEN",
    "NKE", "LULU", "UAA", "ADDYY", "CROX", "BABA", "JD", "PDD",
    "WMT", "TGT", "COST", "HD", "LOW", "AMZN", "ETSY", "EBAY",
    "SPOT", "RBLX", "U", "ZM", "DOCU", "OKTA", "DDOG", "NET",
    "SNAP", "PINS", "TWTR", "FB", "INSTA", "TIKTOK", "ROKU", "TTD",
    "PARA", "WBD", "CMCSA", "T", "VZ", "TMUS", "S", "LUMN",
    "DELL", "HPQ", "NTNX", "PSTG"
]

async def test_ticker(session, ticker, base_url="http://127.0.0.1:8000"):

    try:
        start = time.time()
        async with session.get(f"{base_url}/sentiment/{ticker}") as resp:
            elapsed = time.time() - start
            if resp.status == 200:
                data = await resp.json()
                return {
                    "ticker": ticker,
                    "success": True,
                    "status": resp.status,
                    "time": elapsed,
                    "sentiment": data.get("sentiment")
                }
            else:
                return {
                    "ticker": ticker,
                    "success": False,
                    "status": resp.status,
                    "time": elapsed,
                    "error": f"HTTP {resp.status}"
                }
    except Exception as e:
        return {
            "ticker": ticker,
            "success": False,
            "status": 0,
            "time": 0,
            "error": str(e)
        }

async def run_load_test(tickers, concurrent=10):
    
    print(f"\n{'='*60}")
    print(f"Load Test Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Testing {len(tickers)} tickers with concurrency={concurrent}")
    print(f"{'='*60}\n")
    
    results = []
    
    async with aiohttp.ClientSession() as session:
        
        for i in range(0, len(tickers), concurrent):
            batch = tickers[i:i+concurrent]
            tasks = [test_ticker(session, ticker) for ticker in batch]
            batch_results = await asyncio.gather(*tasks)
            results.extend(batch_results)
            print(f"Processed {min(i+concurrent, len(tickers))}/{len(tickers)} tickers...")
    
    # Calculate stats
    successes = [r for r in results if r["success"]]
    failures = [r for r in results if not r["success"]]
    
    success_rate = (len(successes) / len(results)) * 100
    avg_time = sum(r["time"] for r in successes) / len(successes) if successes else 0
    
    print(f"\n{'='*60}")
    print(f"RESULTS")
    print(f"{'='*60}")
    print(f"Total requests:    {len(results)}")
    print(f"Successful:        {len(successes)} ({success_rate:.2f}%)")
    print(f"Failed:            {len(failures)}")
    print(f"Avg response time: {avg_time*1000:.2f}ms")
    print(f"{'='*60}\n")
    
    if failures:
        print("Failed tickers:")
        for f in failures[:10]:  #
            print(f"  - {f['ticker']}: {f.get('error', 'Unknown')}")
    
    return {
        "total": len(results),
        "success": len(successes),
        "failed": len(failures),
        "success_rate": success_rate,
        "avg_time_ms": avg_time * 1000,
        "results": results
    }

if __name__ == "__main__":
    stats = asyncio.run(run_load_test(TICKERS, concurrent=20))