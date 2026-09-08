"""Unit tests for Phase 4: Sentence Transformer Embeddings."""

import numpy as np
import pytest
from backend.app.embeddings import EmbeddingManager


@pytest.fixture(scope="module")
def embedding_mgr():
    """Module-level fixture to load embedding model once across tests."""
    return EmbeddingManager.get_instance()


def test_embedding_model_dimension(embedding_mgr: EmbeddingManager):
    """Verify that all-mpnet-base-v2 outputs 768-dimensional vectors."""
    assert embedding_mgr.dimension == 768


def test_encode_single_text_l2_normalized(embedding_mgr: EmbeddingManager):
    """Verify that a single text yields a float32 vector with unit L2 norm."""
    text = "Gradients are calculated using the chain rule of calculus."
    vec = embedding_mgr.encode_text(text)

    assert isinstance(vec, np.ndarray)
    assert vec.dtype == np.float32
    assert vec.shape == (768,)

    # L2 norm of normalized vector must equal 1.0 (within float precision)
    norm = float(np.linalg.norm(vec))
    assert pytest.approx(norm, abs=1e-5) == 1.0


def test_encode_batch_texts(embedding_mgr: EmbeddingManager):
    """Verify batch encoding returns an (N, d) float32 matrix."""
    texts = [
        "First academic passage on machine learning.",
        "Second passage explaining support vector machines.",
        "Third passage regarding transformer attention mechanisms.",
    ]
    matrix = embedding_mgr.encode_texts(texts)

    assert isinstance(matrix, np.ndarray)
    assert matrix.shape == (3, 768)
    for i in range(3):
        norm = float(np.linalg.norm(matrix[i]))
        assert pytest.approx(norm, abs=1e-5) == 1.0


def test_semantic_similarity_relationship(embedding_mgr: EmbeddingManager):
    """Verify semantic geometry: related concepts must have higher similarity than unrelated."""
    query = "How does deep learning train weights?"
    doc_relevant = "Backpropagation calculates the gradient of the loss function to update neural weights."
    doc_irrelevant = "A chocolate chip cookie requires flour, butter, sugar, and baking powder."

    q_vec = embedding_mgr.encode_text(query)
    rel_vec = embedding_mgr.encode_text(doc_relevant)
    irrel_vec = embedding_mgr.encode_text(doc_irrelevant)

    sim_relevant = EmbeddingManager.compute_similarity(q_vec, rel_vec)
    sim_irrelevant = EmbeddingManager.compute_similarity(q_vec, irrel_vec)

    assert sim_relevant > sim_irrelevant
    assert sim_relevant > 0.5  # Strong semantic relationship
    assert sim_irrelevant < 0.3  # Weak semantic relationship
