"""Environment and Setup Validation Tests for Phase 1.

Verifies that all required NLP, deep learning, vector search, and framework
dependencies can be imported and initialized without error.
"""

import pytest
from fastapi.testclient import TestClient

from backend.app.core.config import settings
from backend.app.main import app


def test_core_dependencies_import():
    """Verify that PyTorch, Sentence Transformers, and FAISS import successfully."""
    import torch
    import sentence_transformers
    import faiss
    import numpy as np

    assert torch is not None
    assert sentence_transformers is not None
    assert faiss is not None
    assert np is not None


def test_document_parsers_import():
    """Verify that PDF, DOCX, and PPTX document parsing libraries import successfully."""
    import pypdf
    import docx
    import pptx

    assert pypdf is not None
    assert docx is not None
    assert pptx is not None


def test_settings_initialization():
    """Verify that Pydantic settings are correctly parsed and directories created."""
    assert settings.PROJECT_NAME == "Academic NLP QA & Semantic Search"
    assert settings.EMBEDDING_MODEL_NAME == "sentence-transformers/all-mpnet-base-v2"
    assert settings.DOCUMENTS_UPLOAD_DIR.exists()
    assert settings.FAISS_INDEX_DIR.exists()


def test_fastapi_health_endpoint():
    """Verify that FastAPI application initializes and health check succeeds."""
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["embedding_model"] == "sentence-transformers/all-mpnet-base-v2"
    assert data["directories"]["uploads_dir_exists"] is True
    assert data["directories"]["faiss_dir_exists"] is True
