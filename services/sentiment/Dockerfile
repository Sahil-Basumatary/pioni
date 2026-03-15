FROM python:3.12 AS builder
WORKDIR /build
COPY libs/common ./libs/common
COPY services/sentiment/requirements.txt .
RUN pip install --user --no-cache-dir ./libs/common -r requirements.txt
RUN python -m nltk.downloader -d /usr/share/nltk_data vader_lexicon

FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/home/appuser/.local/bin:$PATH" \
    NLTK_DATA=/usr/share/nltk_data
RUN groupadd --gid 1000 appuser && \
    useradd --uid 1000 --gid 1000 --create-home appuser
COPY --from=builder /root/.local /home/appuser/.local
COPY --from=builder /usr/share/nltk_data /usr/share/nltk_data
RUN chown -R appuser:appuser /home/appuser/.local
WORKDIR /app
COPY --chown=appuser:appuser services/sentiment/sentiment ./sentiment
USER appuser
ENV PORT=8001
EXPOSE ${PORT}
CMD sh -c "uvicorn sentiment.main:app --host 0.0.0.0 --port ${PORT}"

