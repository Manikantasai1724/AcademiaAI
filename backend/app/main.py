"""FastAPI Main Application Entry Point for AcademiaAI.

Provides application initialization, middleware configuration, and core
health check endpoints for the AcademiaAI Academic NLP Semantic Search & QA System.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AcademiaAI — Intelligent Academic Document Analysis & Grounded QA System.",
    debug=settings.DEBUG,
)

# Configure Cross-Origin Resource Sharing (CORS) for local frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restricted in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API routes
from backend.app.api.routes import router as api_router
app.include_router(api_router)


@app.get("/", tags=["General"])
async def root():
    """Root entrypoint returning project metadata and current status."""
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs",
    }


@app.get("/health", tags=["General"])
async def health_check():
    """System health check verifying configuration and directory persistence readiness."""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "embedding_model": settings.EMBEDDING_MODEL_NAME,
        "directories": {
            "uploads_dir_exists": settings.DOCUMENTS_UPLOAD_DIR.exists(),
            "faiss_dir_exists": settings.FAISS_INDEX_DIR.exists(),
        },
        "retrieval_defaults": {
            "top_k": settings.TOP_K,
            "similarity_threshold": settings.SIMILARITY_THRESHOLD,
        },
    }
