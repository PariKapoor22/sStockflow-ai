FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/services/copilot-service:/app/mcp \
    STOCKFLOW_CHATBOT_DATA_DIR=/app/data/chatbot

WORKDIR /app

COPY mcp /app/mcp
COPY services/copilot-service /app/services/copilot-service
COPY data/chatbot /app/data/chatbot

RUN pip install --no-cache-dir /app/mcp /app/services/copilot-service

CMD ["python", "/app/services/copilot-service/cloud_entrypoint.py"]
