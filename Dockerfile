# ==============================================================================
# Dockerfile for AcademiaAI Backend (FastAPI + PyTorch + FAISS)
# Compatible with Hugging Face Spaces (Port 7860), Render, and standard VPS
# ==============================================================================

FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=7860

WORKDIR /app

# Install system dependencies needed for compiling or handling PDFs/images
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Pre-download the embedding model into the container cache to ensure instant boot
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('BAAI/bge-base-en-v1.5')"

# Copy application source code
COPY backend ./backend
COPY reindex.py .

# Create persistent storage directories and ensure write permissions for non-root users
RUN mkdir -p data/uploads data/faiss && chmod -R 777 /app

# Expose standard HF Space port (7860) and standard API port (8000)
EXPOSE 7860
EXPOSE 8000

# Start FastAPI application dynamically on the configured PORT
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-7860}"]
