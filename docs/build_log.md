## Build Log

# Milestone 1 — Project Setup

Set up the folder structure for backend and frontend. Installed FastAPI and created a very simple test route just to confirm uvicorn was running. Frontend created with Vite React template. Nothing special yet.

# Milestone 2 — First Working Sentiment Endpoint

Added a basic sentiment API route. At this stage it only returned a placeholder JSON response. Tried connecting NewsAPI but hit missing key issues so kept it simple for now. Confirmed the route works in the browser.

# Milestone 3 — Frontend Fetch Connected

Linked the frontend button to the backend. First few attempts failed because the endpoint URL was wrong. After fixing that, the frontend crashed because I forgot to check response.ok before parsing JSON. Added basic error handling and it stopped crashing.

# Milestone 4 — Real Sentiment Function Attempt

Wrote the first version of fetch_news_sentiment and fetch_reddit_sentiment. This was much harder than expected. Both parts failed due to missing API keys and Reddit permissions. At this point the project was getting stuck so I paused and focused on making something that actually runs.

# Milestone 5 — Added Mock Mode

To avoid constant crashes while I figure out API keys, added USE_MOCK mode. When mock mode is on, the backend returns fake sentiment numbers. This made the UI much easier to develop and test. Also added two example tickers to MOCK_DATA.

# Milestone 6 — Logging Added

Backend was failing silently sometimes so added basic logging to logs/app.log. Now I can see why errors happen and what request triggered them. First issue was NameError from USE_MOCK not being defined, fixed that and confirmed in the logs.

# Milestone 7 — UI Rewrite

The original UI looked too dull so rewrote it using Tailwind. Added a side panel layout inspired by finance/tech dashboards. Added confidence bar and quick sentiment labels for punchiness. Also added loading state but kept it simple for now. Will make it prettier later

# Milestone 8 — Small Fixes and Clean Up

Cleaned up unnecessary planning docs. 