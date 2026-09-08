"""Data models for dense vector embeddings."""

from typing import List
from pydantic import BaseModel, Field


class EmbeddingVector(BaseModel):
    """Dense vector representation for a chunk or query."""

    vector: List[float] = Field(
        ...,
        description="L2-normalized dense embedding vector floats.",
    )
    dimension: int = Field(
        ...,
        description="Vector dimension (e.g. 768 for all-mpnet-base-v2).",
    )
