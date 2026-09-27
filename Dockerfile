# ==============================================================================
# Optimized Dockerfile for Render 512MB Free Tier & Hugging Face Spaces
# Uses CPU-only PyTorch to eliminate 2.5GB of CUDA bloat and stay under 512MB RAM
# ==============================================================================

FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    OMP_NUM_THREADS=1 \
    MKL_NUM_THREADS=1

WORKDIR /app

# Install system dependencies needed for compiling or handling PDFs/images
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 1. Install lightweight CPU-only PyTorch first (saves ~2.5GB disk and avoids 512MB OOM)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# 2. Install remaining dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3. Pre-download the lightweight, top-performing bge-small model (only 133MB, fits safely in 512MB RAM)
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('BAAI/bge-small-en-v1.5')"

# 4. Copy application source code
COPY backend ./backend
COPY reindex.py .

# 5. Create storage directories and set write permissions
RUN mkdir -p data/uploads data/faiss && chmod -R 777 /app

# Expose standard ports
EXPOSE 8000
EXPOSE 10000
EXPOSE 7860

# Start FastAPI server dynamically binding to the port assigned by Render/HF/Docker
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
