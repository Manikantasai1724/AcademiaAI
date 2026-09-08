"""Data models for FAISS vector search and retrieval results."""

from typing import List, Optional
from pydantic import BaseModel, Field

from backend.app.nlp.models import DocumentChunk


class SearchResult(BaseModel):
    """Represents a single retrieved document chunk with similarity score and rank."""

    chunk: DocumentChunk = Field(
        ...,
        description="Retrieved document chunk with complete metadata and source page.",
    )
    score: float = Field(
        ...,
        description="Cosine similarity score (between -1.0 and 1.0).",
    )
    rank: int = Field(
        ...,
        ge=1,
        description="1-indexed relevance rank in the retrieved list.",
    )


class SearchResponse(BaseModel):
    """Complete response payload for a semantic search query."""

    query: str = Field(
        ...,
        description="The natural language question or search query.",
    )
    total_indexed_chunks: int = Field(
        ...,
        description="Total number of chunks currently stored in the FAISS index.",
    )
    results: List[SearchResult] = Field(
        ...,
        description="Ranked list of top-K relevant chunks above threshold.",
    )
    confidence_passed: bool = Field(
        default=True,
        description="Flag indicating whether retrieved chunks satisfied the similarity threshold.",
    )
