"""REST API Endpoints for Academic NLP QA and Semantic Search System."""

import logging
import shutil
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

from backend.app.api.dependencies import (
    get_chunker,
    get_embedding_manager,
    get_rag_service,
    get_vector_store,
)
from backend.app.core.config import settings
from backend.app.documents import DocumentIngestionService
from backend.app.embeddings import EmbeddingManager
from backend.app.nlp.chunker import IntelligentChunker
from backend.app.nlp.models import DocumentChunk
from backend.app.rag import QARequest, QAResponse, RAGService
from backend.app.retrieval import FAISSVectorStore, SearchResponse, SearchResult

router = APIRouter(prefix="/api", tags=["NLP Academic System"])


class DocumentUploadResponse(BaseModel):
    """Metadata response after successful document ingestion, chunking, and indexing."""
    document_id: str
    filename: str
    file_type: str
    total_pages: int
    chunks_created: int
    message: str


class SearchQueryRequest(BaseModel):
    """Request payload for semantic vector search."""
    query: str = Field(..., min_length=2, description="Natural language search query.")
    top_k: Optional[int] = Field(default=None, ge=1, le=50)
    threshold: Optional[float] = Field(default=None, ge=0.0, le=1.0)


@router.post(
    "/documents/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and index an academic document (PDF, DOCX, PPTX, TXT)",
)
async def upload_document(
    file: UploadFile = File(...),
    vector_store: FAISSVectorStore = Depends(get_vector_store),
    embedding_manager: EmbeddingManager = Depends(get_embedding_manager),
    chunker: IntelligentChunker = Depends(get_chunker),
):
    """Upload an academic document, extract text page-by-page, chunk it, embed it, and index in FAISS."""
    filename = file.filename or "uploaded_file"
    file_ext = Path(filename).suffix.lower().lstrip(".")

    allowed_exts = {"pdf", "docx", "pptx", "txt"}
    if file_ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '.{file_ext}'. Allowed types: {', '.join(sorted(allowed_exts))}",
        )

    # Save uploaded file to disk
    settings.DOCUMENTS_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    destination = settings.DOCUMENTS_UPLOAD_DIR / filename
    with open(destination, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 1. Document Extraction (Phase 2)
        extracted_doc = DocumentIngestionService.extract_document(
            file_path=destination,
            original_filename=filename,
        )

        if extracted_doc.total_pages > 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Document exceeds the 50-page limit for cloud processing ({extracted_doc.total_pages} pages detected). Please upload an excerpt or smaller document.",
            )

        # 2. Text Cleaning & Intelligent Chunking (Phase 3)
        chunks: List[DocumentChunk] = chunker.chunk_document(extracted_doc)
        if not chunks:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="No readable text content could be extracted from this document.",
            )

        # Cloud free-tier safeguard: cap indexing at 150 passages per file to avoid 512MB OOM and timeouts
        original_chunk_count = len(chunks)
        if len(chunks) > 150:
            chunks = chunks[:150]

        # 3. Dense Vector Embeddings (Phase 4)
        texts = [chunk.text for chunk in chunks]
        embeddings = embedding_manager.encode_texts(texts, batch_size=4)

        # 4. FAISS Vector Indexing & Persistence (Phase 5)
        vector_store.add_chunks(chunks=chunks, embeddings=embeddings)
        vector_store.save()

        msg = f"Successfully indexed {len(chunks)} chunks across {extracted_doc.total_pages} pages/slides."
        if original_chunk_count > 150:
            msg += f" (Indexed first 150 of {original_chunk_count} passages to fit cloud limits)"

        return DocumentUploadResponse(
            document_id=extracted_doc.document_id,
            filename=extracted_doc.filename,
            file_type=extracted_doc.file_type,
            total_pages=extracted_doc.total_pages,
            chunks_created=len(chunks),
            message=msg,
        )

    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document processing failed: {str(e)}",
        )


@router.get(
    "/documents",
    summary="List all indexed academic documents and corpus statistics",
)
async def list_documents(
    vector_store: FAISSVectorStore = Depends(get_vector_store),
):
    """Retrieve corpus overview, total indexed chunks, and unique documents."""
    stats = vector_store.get_stats()
    # Group chunk metadata by document
    docs_map: Dict[str, Dict[str, Any]] = {}
    for chunk in vector_store.chunks_metadata:
        doc_id = chunk.document_id
        if doc_id not in docs_map:
            docs_map[doc_id] = {
                "document_id": doc_id,
                "filename": chunk.filename,
                "file_type": chunk.file_type,
                "chunk_count": 0,
                "max_page": 0,
            }
        docs_map[doc_id]["chunk_count"] += 1
        docs_map[doc_id]["max_page"] = max(docs_map[doc_id]["max_page"], chunk.page_number)

    return {
        "corpus_stats": stats,
        "documents": list(docs_map.values()),
    }


@router.post(
    "/search",
    response_model=SearchResponse,
    summary="Semantic vector search over indexed document chunks (FAISS)",
)
async def semantic_search(
    request: SearchQueryRequest,
    vector_store: FAISSVectorStore = Depends(get_vector_store),
    embedding_manager: EmbeddingManager = Depends(get_embedding_manager),
):
    """Convert query into dense embedding and retrieve top-K semantically closest chunks."""
    query_vector = embedding_manager.encode_text(request.query)
    results: List[SearchResult] = vector_store.search(
        query_vector=query_vector,
        top_k=request.top_k or settings.TOP_K,
        threshold=request.threshold if request.threshold is not None else settings.SIMILARITY_THRESHOLD,
    )

    return SearchResponse(
        query=request.query,
        total_indexed_chunks=vector_store.total_chunks,
        results=results,
        confidence_passed=len(results) > 0,
    )


@router.post(
    "/qa",
    response_model=QAResponse,
    summary="Ask a question and receive a grounded RAG answer with verified citations",
)
async def answer_question(
    request: QARequest,
    rag_service: RAGService = Depends(get_rag_service),
):
    """End-to-end RAG pipeline: Query -> FAISS Retrieval -> Context Building -> Gemini Synthesis."""
    response = rag_service.answer_question(request)
    return response


@router.get(
    "/chunks",
    summary="Inspect retrieved or indexed raw text chunks and provenance metadata",
)
async def inspect_chunks(
    document_id: Optional[str] = Query(None, description="Filter chunks by document ID"),
    vector_store: FAISSVectorStore = Depends(get_vector_store),
):
    """Allow user inspection of the atomic chunks stored in the system."""
    chunks = vector_store.chunks_metadata
    if document_id:
        chunks = [c for c in chunks if c.document_id == document_id]
    return {
        "total": len(chunks),
        "chunks": chunks,
    }


@router.delete(
    "/index",
    summary="Purge the FAISS vector index and metadata store",
)
async def clear_index(
    vector_store: FAISSVectorStore = Depends(get_vector_store),
):
    """Clear in-memory vector index and delete serialized index files from disk."""
    vector_store.clear()
    if settings.faiss_index_path.exists():
        settings.faiss_index_path.unlink()
    if settings.metadata_store_path.exists():
        settings.metadata_store_path.unlink()
    return {"message": "Vector index and metadata store have been cleared successfully."}


@router.post(
    "/documents/reindex",
    summary="Re-index all uploaded documents using the configured embedding model",
)
async def reindex_documents(
    vector_store: FAISSVectorStore = Depends(get_vector_store),
    embedding_manager: EmbeddingManager = Depends(get_embedding_manager),
    chunker: IntelligentChunker = Depends(get_chunker),
):
    """Purge existing index and rebuild all embeddings for files in data/uploads."""
    vector_store.clear()
    if settings.faiss_index_path.exists():
        settings.faiss_index_path.unlink()
    if settings.metadata_store_path.exists():
        settings.metadata_store_path.unlink()

    upload_files = [
        f for f in settings.DOCUMENTS_UPLOAD_DIR.iterdir()
        if f.is_file() and f.suffix.lower().lstrip(".") in {"pdf", "docx", "pptx", "txt"}
    ]

    total_chunks = 0
    indexed_files = []

    for file_path in upload_files:
        try:
            doc = DocumentIngestionService.extract_document(
                file_path=file_path,
                original_filename=file_path.name,
            )
            chunks = chunker.chunk_document(doc)
            if chunks:
                texts = [c.text for c in chunks]
                embeddings = embedding_manager.encode_texts(texts)
                vector_store.add_chunks(chunks=chunks, embeddings=embeddings)
                total_chunks += len(chunks)
                indexed_files.append({"filename": file_path.name, "chunks": len(chunks)})
        except Exception as e:
            logger.error("Failed to reindex %s: %s", file_path.name, e)

    vector_store.save()

    return {
        "message": f"Successfully re-indexed {len(indexed_files)} documents ({total_chunks} total chunks) using {settings.EMBEDDING_MODEL_NAME}.",
        "embedding_model": settings.EMBEDDING_MODEL_NAME,
        "indexed_files": indexed_files,
        "total_chunks": total_chunks,
    }
