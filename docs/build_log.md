# Build Log

## Update 1: project start
Got the repo set up and added a basic folder layout. I wrote down the main idea behind the project and some goals so I have something to refer back to.

## Update 2: some future plans
Planning to start working on the backend using FastAPI. Also want to test out different sources I can use to pull sentiment data. Before any frontend , I'm sketching out some simple UI wireframes to get a feel for the layout.

## Update 3: First Sentiment Feature Working
Got the first version of the sentiment extraction running using data from NewsAPI and Reddit. Added a route (`/sentiment/{ticker}`) that returns a combined score. Tested it locally using TSLA, AAPL, and NVDA. Might add twitter later

## Update 4: Writing Tests
Added `pytest` and wrote a basic test to check if the API health check endpoint works. More tests to come once I build out more features.