# Pioni
A live trading intelligence platform which uses human emotions, social sentiments to expose users with high frequency insights before the market moves

**Status** : early development

## What it does so far

 

Analyzes sentiment for stock tickers by aggregating data from:

1. NewsAPI (headlines about the stock)

2.  Reddit (r/stocks, r/wallstreetbets, r/investing)

 Returns a sentiment score from -1 (very negative) to +1 (very positive).

## Setup

### Backend
```bash
cd src/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
### Frontend
```bash
cd src/frontend
npm install
npm run dev
```
Visit http://localhost:5173

## Tech stack

- Backend: FastAPI, TextBlob, PRAW
- Frontend: React, Tailwind CSS
- Sentiment: TextBlob (basic, planning to upgrade)

## Known Issues
- TextBlob sentiment is pretty basic
- No rate limiting yet
- NewsAPI free tier = 100 req/day
- Mock mode on by default 
- RedditAPI can block unauthenticated requetsts

