FROM python:3.12 AS builder
WORKDIR /build
COPY libs/common ./libs/common
COPY services/portfolio/requirements.txt .
RUN pip install --user --no-cache-dir ./libs/common -r requirements.txt

FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/home/appuser/.local/bin:$PATH"
RUN groupadd --gid 1000 appuser && \
    useradd --uid 1000 --gid 1000 --create-home appuser
COPY --from=builder /root/.local /home/appuser/.local
RUN chown -R appuser:appuser /home/appuser/.local
WORKDIR /app
COPY --chown=appuser:appuser services/portfolio/portfolio ./portfolio
USER appuser
EXPOSE 8004
CMD ["uvicorn", "portfolio.main:app", "--host", "0.0.0.0", "--port", "8004"]

