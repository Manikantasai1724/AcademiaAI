"""Dense vector embeddings generation package using Sentence Transformers."""

from .models import EmbeddingVector
from .manager import EmbeddingManager

__all__ = ["EmbeddingVector", "EmbeddingManager"]
