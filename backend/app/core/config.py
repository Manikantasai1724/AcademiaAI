"""Application Configuration Module.

Manages all global application settings, paths, model identifiers,
and retrieval thresholds using Pydantic Settings for runtime validation.
"""

from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration class for the NLP QA & Semantic Search system."""

    # Application details
    PROJECT_NAME: str = "Academic NLP QA & Semantic Search"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # API Keys & Generation Settings (Gemini)
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL_NAME: str = "gemini-1.5-flash"

    # Dense Embedding Model Configuration (Sentence Transformers)
    # Default model: sentence-transformers/all-mpnet-base-v2
    # Yields 768-dimensional L2-normalized embeddings
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/all-mpnet-base-v2"

    # Storage & Persistence Directories
    DATA_DIR: Path = Path("data")
    DOCUMENTS_UPLOAD_DIR: Path = Path("data/uploads")
    FAISS_INDEX_DIR: Path = Path("data/faiss")
    FAISS_INDEX_FILE: str = "index.bin"
    METADATA_STORE_FILE: str = "metadata.json"

    # Information Retrieval & Semantic Search Thresholds
    # Minimum cosine similarity required to consider a chunk relevant
    SIMILARITY_THRESHOLD: float = 0.35
    TOP_K: int = 5

    # Text Chunking Settings
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    def ensure_directories(self) -> None:
        """Ensure necessary data and upload directories exist on disk."""
        self.DOCUMENTS_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        self.FAISS_INDEX_DIR.mkdir(parents=True, exist_ok=True)

    @property
    def faiss_index_path(self) -> Path:
        """Return the absolute/relative file path to the FAISS index binary."""
        return self.FAISS_INDEX_DIR / self.FAISS_INDEX_FILE

    @property
    def metadata_store_path(self) -> Path:
        """Return the absolute/relative file path to the metadata JSON store."""
        return self.FAISS_INDEX_DIR / self.METADATA_STORE_FILE


# Global singleton settings instance
settings = Settings()
settings.ensure_directories()
