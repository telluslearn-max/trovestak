# Use official Python 3.11 slim image
FROM python:3.11-slim AS base
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY apps/ml-service/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY apps/ml-service/src ./src

EXPOSE 8001
CMD ["sh", "-c", "uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-8001}"]
