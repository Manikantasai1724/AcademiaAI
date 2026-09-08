"""Dependency injection providers for vector store and services."""

from pathlib import Path
from typing import Optional
from backend.app.core.config import settings
from backend.app.embeddings import EmbeddingManager
from backend.app.nlp.chunker import IntelligentChunker
from backend.app.rag import RAGService
from backend.app.retrieval import FAISSVectorStore

# Application-wide singletons
_vector_store: Optional[FAISSVectorStore] = None
_rag_service: Optional[RAGService] = None
_chunker: Optional[IntelligentChunker] = None


def get_embedding_manager() -> EmbeddingManager:
    """Return the global EmbeddingManager singleton."""
    return EmbeddingManager.get_instance()


def get_vector_store() -> FAISSVectorStore:
    """Return the initialized FAISSVectorStore, loading existing index from disk if present."""
    global _vector_store
    if _vector_store is None:
        emb_mgr = get_embedding_manager()
        _vector_store = FAISSVectorStore(dimension=emb_mgr.dimension)
        # Attempt to load serialized index from data/faiss/
        if settings.faiss_index_path.exists() and settings.metadata_store_path.exists():
            _vector_store.load(settings.faiss_index_path, settings.metadata_store_path)
    return _vector_store


def get_rag_service() -> RAGService:
    """Return the RAGService singleton wired to the vector store."""
    global _rag_service
    if _rag_service is None:
        store = get_vector_store()
        emb_mgr = get_embedding_manager()
        _rag_service = RAGService(vector_store=store, embedding_manager=emb_mgr)
    return _rag_service


def get_chunker() -> IntelligentChunker:
    """Return the configured IntelligentChunker."""
    global _chunker
    if _chunker is None:
        _chunker = IntelligentChunker(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
        )
    return _chunker
