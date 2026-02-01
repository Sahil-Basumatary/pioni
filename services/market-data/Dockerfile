FROM python:3.12 AS builder
WORKDIR /build
COPY libs/common ./libs/common
COPY services/market-data/requirements.txt .
RUN sed -i 's|-e ../../libs/common|./libs/common|' requirements.txt
RUN pip install --user --no-cache-dir -r requirements.txt

FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/home/appuser/.local/bin:$PATH"
RUN groupadd --gid 1000 appuser && \
    useradd --uid 1000 --gid 1000 --create-home appuser
COPY --from=builder /root/.local /home/appuser/.local
RUN chown -R appuser:appuser /home/appuser/.local
WORKDIR /app
COPY --chown=appuser:appuser services/market-data/market_data ./market_data
USER appuser
EXPOSE 8002
CMD ["uvicorn", "market_data.main:app", "--host", "0.0.0.0", "--port", "8002"]

