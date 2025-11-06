from fastapi import FastAPI
from newsapi import NewsApiClient
from textblob import TextBlob
import os
import praw

def fetch_news_sentiment(ticker: str):
    newsapi = NewsApiClient(api_key=os.getenv("NEWS_API_KEY"))
    
    query = f"{ticker} stock OR shares OR earnings"
    articles = newsapi.get_everything(q=query, language='en', page_size=10)['articles']
    
    sentiments = []
    for article in articles:
        headline = article['title']
        sentiment = TextBlob(headline).sentiment.polarity  # -1 to 1
        sentiments.append(sentiment)
    
    if sentiments:
        avg_sentiment = sum(sentiments) / len(sentiments)
        return round(avg_sentiment, 2)
    else:
        return None
  
def fetch_reddit_sentiment(ticker: str):
    reddit = praw.Reddit(
        client_id=os.getenv("REDDIT_CLIENT_ID"),
        client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
        user_agent="pioni_by_u/AquaBzy"
    )
    #loop for mutiple subreddits for varied sources
    subreddits = ["stocks", "wallstreetbets", "investing"]
    sentiments = []

    for sub in subreddits:
        posts = reddit.subreddit(sub).search(
            query=ticker,
            sort="top",
            limit=10    # can increase it later for better accuracy 
        )
        for post in posts:
            polarity = TextBlob(post.title).sentiment.polarity
            sentiments.append(polarity)

    return round(sum(sentiments) / len(sentiments), 2) if sentiments else None

app = FastAPI(title="Pioni API", version="0.1.0")

@app.get("/health")
def health_check():
    return {"status": "running"}

@app.get("/sentiment/{ticker}")
def get_sentiment(ticker: str):
    news_score = fetch_news_sentiment(ticker)
    reddit_score = fetch_reddit_sentiment(ticker)

    sources = {}
    if news_score is not None:
        sources["newsapi"] = news_score
    if reddit_score is not None:
        sources["reddit"] = reddit_score

    if not sources:
        return {"ticker": ticker.upper(), "error": "No sentiment data found"}

    combined_score = round(sum(sources.values()) / len(sources), 2)

    return {
        "ticker": ticker.upper(),
        "sentiment": combined_score,
        "sources": sources,
        "confidence": round(abs(combined_score), 2)
    }