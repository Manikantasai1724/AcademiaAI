"""Re-index all documents in data/uploads into FAISS using the active embedding model.

Usage:
    python reindex.py
"""

import sys
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(root_dir))

from backend.app.core.config import settings
from backend.app.documents import DocumentIngestionService
from backend.app.embeddings import EmbeddingManager
from backend.app.nlp.chunker import IntelligentChunker
from backend.app.retrieval import FAISSVectorStore


def main():
    print("=" * 60)
    print(f"AcademiaAI Document Re-Indexer")
    print(f"Embedding Model: {settings.EMBEDDING_MODEL_NAME}")
    print(f"Uploads Dir:     {settings.DOCUMENTS_UPLOAD_DIR}")
    print(f"FAISS Dir:       {settings.FAISS_INDEX_DIR}")
    print("=" * 60)

    # 1. Initialize components
    chunker = IntelligentChunker(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
    )
    print("Loading embedding model weights...")
    embedding_manager = EmbeddingManager.get_instance(settings.EMBEDDING_MODEL_NAME)
    print(f"Embedding model loaded. Dimension: {embedding_manager.dimension}")

    vector_store = FAISSVectorStore(
        dimension=embedding_manager.dimension,
    )

    # 2. Clear old index and metadata
    print("Clearing old FAISS index and metadata...")
    vector_store.clear()
    if settings.faiss_index_path.exists():
        settings.faiss_index_path.unlink()
    if settings.metadata_store_path.exists():
        settings.metadata_store_path.unlink()

    # 3. Discover upload files
    allowed_exts = {"pdf", "docx", "pptx", "txt"}
    files = [
        f for f in settings.DOCUMENTS_UPLOAD_DIR.iterdir()
        if f.is_file() and f.suffix.lower().lstrip(".") in allowed_exts
    ]

    if not files:
        print("No documents found in data/uploads to index.")
        return

    print(f"Found {len(files)} document(s) to index:")
    for f in files:
        print(f"  - {f.name} ({f.stat().st_size / 1024:.1f} KB)")
    print("-" * 60)

    total_chunks = 0
    for idx, file_path in enumerate(files, start=1):
        print(f"[{idx}/{len(files)}] Processing: {file_path.name}...")
        try:
            doc = DocumentIngestionService.extract_document(
                file_path=file_path,
                original_filename=file_path.name,
            )
            chunks = chunker.chunk_document(doc)
            if not chunks:
                print(f"  -> Warning: No text chunks extracted from {file_path.name}")
                continue

            texts = [c.text for c in chunks]
            embeddings = embedding_manager.encode_texts(texts)
            vector_store.add_chunks(chunks=chunks, embeddings=embeddings)
            total_chunks += len(chunks)
            print(f"  -> Indexed {len(chunks)} chunks across {doc.total_pages} pages.")
        except Exception as e:
            print(f"  -> Error indexing {file_path.name}: {e}")

    # 4. Save persisted index
    vector_store.save()
    print("=" * 60)
    print(f"SUCCESS: Indexed {total_chunks} total chunks into FAISS.")
    print(f"Index persisted to: {settings.faiss_index_path}")
    print("=" * 60)


if __name__ == "__main__":
    main()
