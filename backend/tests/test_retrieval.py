"""Unit tests for Phase 5: FAISS Vector Storage and Semantic Search."""

from pathlib import Path
import numpy as np
import pytest

from backend.app.embeddings import EmbeddingManager
from backend.app.nlp.models import DocumentChunk
from backend.app.retrieval import FAISSVectorStore, SearchResult


@pytest.fixture
def sample_chunks() -> list[DocumentChunk]:
    """Fixture providing sample academic chunks across multiple pages."""
    return [
        DocumentChunk(
            chunk_id="doc_dl_p14_c001",
            document_id="doc_dl",
            filename="deep_learning.pdf",
            file_type="pdf",
            page_number=14,
            section="Backpropagation Algorithm",
            text="Backpropagation calculates gradients through reverse accumulation in computational graphs.",
            char_length=91,
        ),
        DocumentChunk(
            chunk_id="doc_dl_p22_c001",
            document_id="doc_dl",
            filename="deep_learning.pdf",
            file_type="pdf",
            page_number=22,
            section="Convolutional Architectures",
            text="Convolutional layers use shared weight filters to detect translation-invariant spatial patterns.",
            char_length=96,
        ),
        DocumentChunk(
            chunk_id="doc_nlp_p5_c001",
            document_id="doc_nlp",
            filename="nlp_lecture.pptx",
            file_type="pptx",
            page_number=5,
            section="Self-Attention Mechanism",
            text="Self-attention computes matrix products of Queries, Keys, and Values scaled by root dimension.",
            char_length=93,
        ),
    ]


def test_faiss_vector_store_indexing_and_search(tmp_path: Path, sample_chunks: list[DocumentChunk]):
    """Verify adding chunks and retrieving top-K semantic matches."""
    emb_mgr = EmbeddingManager.get_instance()
    texts = [c.text for c in sample_chunks]
    embeddings = emb_mgr.encode_texts(texts)

    store = FAISSVectorStore(dimension=emb_mgr.dimension)
    added = store.add_chunks(sample_chunks, embeddings)
    assert added == 3
    assert store.total_chunks == 3

    # Query for backpropagation
    q_vec = emb_mgr.encode_text("How do neural networks compute loss gradients?")
    results = store.search(q_vec, top_k=2, threshold=0.30)

    assert len(results) > 0
    top_result = results[0]
    assert isinstance(top_result, SearchResult)
    assert top_result.rank == 1
    assert top_result.chunk.filename == "deep_learning.pdf"
    assert top_result.chunk.page_number == 14
    assert "Backpropagation" in top_result.chunk.section
    assert top_result.score > 0.40


def test_faiss_threshold_filtering(sample_chunks: list[DocumentChunk]):
    """Verify that chunks with similarity below threshold are excluded."""
    emb_mgr = EmbeddingManager.get_instance()
    embeddings = emb_mgr.encode_texts([c.text for c in sample_chunks])

    store = FAISSVectorStore(dimension=emb_mgr.dimension)
    store.add_chunks(sample_chunks, embeddings)

    # Search with completely unrelated query with strict threshold
    q_vec = emb_mgr.encode_text("What is the recipe for chocolate chip cookies?")
    results = store.search(q_vec, top_k=5, threshold=0.60)
    assert len(results) == 0


def test_faiss_persistence_save_and_load(tmp_path: Path, sample_chunks: list[DocumentChunk]):
    """Verify serializing and deserializing the FAISS index and metadata store."""
    emb_mgr = EmbeddingManager.get_instance()
    embeddings = emb_mgr.encode_texts([c.text for c in sample_chunks])

    store = FAISSVectorStore(dimension=emb_mgr.dimension)
    store.add_chunks(sample_chunks, embeddings)

    index_path = tmp_path / "test_index.bin"
    meta_path = tmp_path / "test_metadata.json"

    store.save(index_path=index_path, metadata_path=meta_path)
    assert index_path.exists()
    assert meta_path.exists()

    new_store = FAISSVectorStore(dimension=emb_mgr.dimension)
    loaded = new_store.load(index_path=index_path, metadata_path=meta_path)
    assert loaded is True
    assert new_store.total_chunks == 3
    assert len(new_store.chunks_metadata) == 3
    assert new_store.chunks_metadata[0].chunk_id == sample_chunks[0].chunk_id
