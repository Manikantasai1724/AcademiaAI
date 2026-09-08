"""Integration tests for Phase 9: FastAPI REST Endpoints."""

import io
from fastapi.testclient import TestClient
import pytest

from backend.app.main import app

client = TestClient(app)


def test_api_full_workflow():
    """Verify upload -> search -> QA -> inspect -> clear end-to-end API pipeline."""
    # 1. Clear any residual index
    clear_res = client.delete("/api/index")
    assert clear_res.status_code == 200

    # 2. Test Document Upload (Phase 2, 3, 4, 5)
    sample_content = (
        "Backpropagation is an algorithm used in machine learning to train neural networks.\n"
        "It efficiently computes the gradient of the loss function with respect to the network weights.\n"
        "Stochastic Gradient Descent (SGD) then updates the weights in the opposite direction of the gradient."
    )
    file_bytes = io.BytesIO(sample_content.encode("utf-8"))
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("deep_learning_intro.txt", file_bytes, "text/plain")},
    )
    assert upload_res.status_code == 201
    upload_data = upload_res.json()
    assert upload_data["filename"] == "deep_learning_intro.txt"
    assert upload_data["chunks_created"] >= 1
    doc_id = upload_data["document_id"]

    # 3. Test List Documents
    docs_res = client.get("/api/documents")
    assert docs_res.status_code == 200
    docs_data = docs_res.json()
    assert docs_data["corpus_stats"]["total_indexed_chunks"] >= 1
    assert len(docs_data["documents"]) >= 1

    # 4. Test Semantic Search (Phase 5)
    search_res = client.post(
        "/api/search",
        json={"query": "How are neural network weights updated?", "top_k": 3, "threshold": 0.25},
    )
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert search_data["confidence_passed"] is True
    assert len(search_data["results"]) >= 1
    assert search_data["results"][0]["chunk"]["filename"] == "deep_learning_intro.txt"
    assert search_data["results"][0]["score"] > 0.30

    # 5. Test Question Answering / RAG (Phases 6, 7, 8)
    qa_res = client.post(
        "/api/qa",
        json={"question": "What does backpropagation compute?", "top_k": 3, "threshold": 0.25},
    )
    assert qa_res.status_code == 200
    qa_data = qa_res.json()
    assert qa_data["confidence_passed"] is True
    assert qa_data["is_grounded"] is True
    assert len(qa_data["sources"]) >= 1
    citation = qa_data["sources"][0]
    assert citation["filename"] == "deep_learning_intro.txt"
    assert citation["page_number"] == 1
    assert "gradient" in citation["passage"].lower()

    # 6. Test Inspect Chunks
    chunks_res = client.get(f"/api/chunks?document_id={doc_id}")
    assert chunks_res.status_code == 200
    assert chunks_res.json()["total"] >= 1

    # 7. Test Clear Index
    delete_res = client.delete("/api/index")
    assert delete_res.status_code == 200
    empty_docs = client.get("/api/documents").json()
    assert empty_docs["corpus_stats"]["total_indexed_chunks"] == 0
