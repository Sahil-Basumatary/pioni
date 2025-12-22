import random
from datetime import datetime, timedelta, timezone

async def get_history(ticker: str):
    history = []
    today = datetime.now(timezone.utc)

    for i in range(7):
        day = today - timedelta(days=i)
        history.append({"date": day.strftime("%Y-%m-%d"), "score": round(random.uniform(-1, 1), 2)})

    return {"ticker": ticker.upper(), "history": list(reversed(history))}