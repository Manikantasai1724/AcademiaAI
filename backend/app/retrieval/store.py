"""FAISS vector store and similarity retrieval engine.

Provides high-performance vector indexing using faiss.IndexFlatIP for exact
inner product (cosine) search with atomic persistence and metadata mapping.
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional
import faiss
import numpy as np

from backend.app.core.config import settings
from backend.app.nlp.models import DocumentChunk
from backend.app.retrieval.models import SearchResult


class FAISSVectorStore:
    """In-memory FAISS vector index with disk serialization and metadata management."""

    def __init__(self, dimension: int = 768):
        self.dimension = dimension
        # IndexFlatIP computes exact inner product.
        # Since all embeddings are L2-normalized, inner product == cosine similarity.
        self.index: faiss.IndexFlatIP = faiss.IndexFlatIP(dimension)
        self.chunks_metadata: List[DocumentChunk] = []

    @property
    def total_chunks(self) -> int:
        """Return the number of vectors indexed in FAISS."""
        return self.index.ntotal

    def add_chunks(self, chunks: List[DocumentChunk], embeddings: np.ndarray) -> int:
        """Add chunks and corresponding L2-normalized embeddings into the FAISS index."""
        if len(chunks) == 0:
            return 0

        if embeddings.shape[0] != len(chunks):
            raise ValueError(
                f"Embedding count ({embeddings.shape[0]}) does not match chunk count ({len(chunks)})."
            )

        if embeddings.shape[1] != self.dimension:
            raise ValueError(
                f"Embedding dimension ({embeddings.shape[1]}) does not match index dimension ({self.dimension})."
            )

        # Ensure float32 and contiguous array
        vectors = np.ascontiguousarray(embeddings, dtype=np.float32)
        self.index.add(vectors)
        self.chunks_metadata.extend(chunks)

        return len(chunks)

    def search(
        self,
        query_vector: np.ndarray,
        top_k: Optional[int] = None,
        threshold: Optional[float] = None,
    ) -> List[SearchResult]:
        """Perform semantic similarity search returning top-K chunks above threshold."""
        k = top_k or settings.TOP_K
        min_threshold = threshold if threshold is not None else settings.SIMILARITY_THRESHOLD

        if self.index.ntotal == 0:
            return []

        # Ensure query vector is 2D float32 of shape (1, dimension)
        if query_vector.ndim == 1:
            query_vector = query_vector.reshape(1, -1)
        query_vector = np.ascontiguousarray(query_vector, dtype=np.float32)

        # Cap k to the number of available items
        actual_k = min(k, self.index.ntotal)
        scores, indices = self.index.search(query_vector, actual_k)

        results: List[SearchResult] = []
        rank = 1
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1:
                continue
            float_score = float(score)
            if float_score >= min_threshold:
                chunk = self.chunks_metadata[idx]
                results.append(
                    SearchResult(
                        chunk=chunk,
                        score=round(float_score, 4),
                        rank=rank,
                    )
                )
                rank += 1

        return results

    def save(
        self,
        index_path: Optional[Path] = None,
        metadata_path: Optional[Path] = None,
    ) -> None:
        """Serialize the FAISS index binary and metadata JSON to disk."""
        target_idx = index_path or settings.faiss_index_path
        target_meta = metadata_path or settings.metadata_store_path

        target_idx.parent.mkdir(parents=True, exist_ok=True)
        target_meta.parent.mkdir(parents=True, exist_ok=True)

        faiss.write_index(self.index, str(target_idx))

        serialized_metadata = [chunk.model_dump() for chunk in self.chunks_metadata]
        with open(target_meta, "w", encoding="utf-8") as f:
            json.dump(serialized_metadata, f, indent=2, ensure_ascii=False)

    def load(
        self,
        index_path: Optional[Path] = None,
        metadata_path: Optional[Path] = None,
    ) -> bool:
        """Deserialize FAISS index and metadata store from disk if they exist."""
        target_idx = index_path or settings.faiss_index_path
        target_meta = metadata_path or settings.metadata_store_path

        if not target_idx.exists() or not target_meta.exists():
            return False

        self.index = faiss.read_index(str(target_idx))

        with open(target_meta, "r", encoding="utf-8") as f:
            raw_metadata = json.load(f)
            self.chunks_metadata = [DocumentChunk(**item) for item in raw_metadata]

        return True

    def clear(self) -> None:
        """Reset index and purge metadata."""
        self.index = faiss.IndexFlatIP(self.dimension)
        self.chunks_metadata = []

    def get_stats(self) -> Dict[str, Any]:
        """Return operational statistics about the vector store."""
        unique_docs = len(set(c.document_id for c in self.chunks_metadata))
        unique_files = list(set(c.filename for c in self.chunks_metadata))
        return {
            "total_indexed_chunks": self.index.ntotal,
            "dimension": self.dimension,
            "unique_documents": unique_docs,
            "indexed_files": unique_files,
        }
