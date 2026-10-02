"""Sentence Transformer embedding manager.

Loads dense bi-encoder models and produces L2-normalized embedding vectors
for document chunks and user queries.
"""

import gc
from typing import List, Optional
import numpy as np
import torch
from sentence_transformers import SentenceTransformer

from backend.app.core.config import settings

# Force single-threaded CPU operations to avoid RAM spikes on low-tier cloud instances
try:
    torch.set_num_threads(1)
except Exception:
    pass


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
        """Return the vector dimensionality (e.g. 384 for bge-small, 768 for bge-base)."""
        if hasattr(self.model, "get_embedding_dimension"):
            return self.model.get_embedding_dimension()
        return self.model.get_sentence_embedding_dimension()

    def encode_text(self, text: str) -> np.ndarray:
        """Encode a single query string into an L2-normalized 1D float32 numpy vector."""
        if not text.strip():
            # Return zero vector if empty
            return np.zeros(self.dimension, dtype=np.float32)

        with torch.inference_mode():
            embedding = self.model.encode(
                text,
                convert_to_numpy=True,
                normalize_embeddings=True,
                show_progress_bar=False,
            )
        return np.asarray(embedding, dtype=np.float32)

    def encode_texts(self, texts: List[str], batch_size: int = 4) -> np.ndarray:
        """Batch encode a list of texts using micro-batches (batch_size=4) to prevent 512MB RAM OOM crashes."""
        if not texts:
            return np.empty((0, self.dimension), dtype=np.float32)

        # Micro-batching (batch_size <= 8) prevents PyTorch intermediate activation buffers from exceeding 512MB RAM
        safe_batch = max(1, min(batch_size, 8))
        with torch.inference_mode():
            embeddings = self.model.encode(
                texts,
                batch_size=safe_batch,
                convert_to_numpy=True,
                normalize_embeddings=True,
                show_progress_bar=False,
            )
        gc.collect()
        return np.asarray(embeddings, dtype=np.float32)

    @classmethod
    def compute_similarity(cls, vec_a: np.ndarray, vec_b: np.ndarray) -> float:
        """Compute cosine similarity between two normalized vectors via dot product."""
        return float(np.dot(vec_a, vec_b))
