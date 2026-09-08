"""Sentence Transformer embedding manager.

Loads dense bi-encoder models and produces L2-normalized embedding vectors
for document chunks and user queries.
"""

from typing import List, Optional
import numpy as np
from sentence_transformers import SentenceTransformer

from backend.app.core.config import settings


class EmbeddingManager:
    """Manages the lifecycle and inference of the dense Sentence Transformer model."""

    _instance: Optional["EmbeddingManager"] = None
    _model: Optional[SentenceTransformer] = None
    _model_name: Optional[str] = None

    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or settings.EMBEDDING_MODEL_NAME

    @classmethod
    def get_instance(cls, model_name: Optional[str] = None) -> "EmbeddingManager":
        """Singleton accessor ensuring weights are loaded into RAM only once."""
        target_model = model_name or settings.EMBEDDING_MODEL_NAME
        if cls._instance is None or cls._model_name != target_model:
            cls._instance = cls(model_name=target_model)
            cls._model_name = target_model
            cls._model = None  # Lazy load on first encode call
        return cls._instance

    @property
    def model(self) -> SentenceTransformer:
        """Lazy-load the SentenceTransformer model on demand."""
        if self._model is None:
            # Loads local weights or downloads from HuggingFace cache
            self._model = SentenceTransformer(self.model_name)
        return self._model

    @property
    def dimension(self) -> int:
        """Return the vector dimensionality (e.g. 768 for all-mpnet-base-v2)."""
        if hasattr(self.model, "get_embedding_dimension"):
            return self.model.get_embedding_dimension()
        return self.model.get_sentence_embedding_dimension()

    def encode_text(self, text: str) -> np.ndarray:
        """Encode a single query string into an L2-normalized 1D float32 numpy vector."""
        if not text.strip():
            # Return zero vector if empty
            return np.zeros(self.dimension, dtype=np.float32)

        embedding = self.model.encode(
            text,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return np.asarray(embedding, dtype=np.float32)

    def encode_texts(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        """Batch encode a list of texts into a 2D float32 numpy array of shape (N, d)."""
        if not texts:
            return np.empty((0, self.dimension), dtype=np.float32)

        embeddings = self.model.encode(
            texts,
            batch_size=batch_size,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=len(texts) > 50,
        )
        return np.asarray(embeddings, dtype=np.float32)

    @classmethod
    def compute_similarity(cls, vec_a: np.ndarray, vec_b: np.ndarray) -> float:
        """Compute cosine similarity between two normalized vectors via dot product."""
        return float(np.dot(vec_a, vec_b))
