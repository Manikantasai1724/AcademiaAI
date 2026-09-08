"""Unit tests for Phases 6, 7, and 8: RAG Generation, Citations, and Low-Confidence Handling."""

import pytest
from backend.app.embeddings import EmbeddingManager
from backend.app.nlp.models import DocumentChunk
from backend.app.rag import Citation, ConversationMessage, QARequest, QAResponse, RAGService
from backend.app.rag.prompts import ACADEMIC_SYSTEM_PROMPT, build_rag_prompt
from backend.app.retrieval import FAISSVectorStore, SearchResult


@pytest.fixture
def populated_vector_store() -> FAISSVectorStore:
    """Fixture providing a FAISS store indexed with academic deep learning concepts."""
    emb_mgr = EmbeddingManager.get_instance()
    chunks = [
        DocumentChunk(
            chunk_id="chunk_dl_01",
            document_id="doc_dl",
            filename="deep_learning_textbook.pdf",
            file_type="pdf",
            page_number=14,
            section="Backpropagation Algorithm",
            text="Backpropagation calculates gradients of the loss function with respect to weights using the chain rule.",
            char_length=105,
        ),
        DocumentChunk(
            chunk_id="chunk_dl_02",
            document_id="doc_dl",
            filename="deep_learning_textbook.pdf",
            file_type="pdf",
            page_number=28,
            section="Optimization Methods",
            text="Adam optimizer combines momentum and RMSProp for adaptive learning rates.",
            char_length=74,
        ),
    ]

    embeddings = emb_mgr.encode_texts([c.text for c in chunks])
    store = FAISSVectorStore(dimension=emb_mgr.dimension)
    store.add_chunks(chunks, embeddings)
    return store


def test_build_rag_prompt():
    """Verify prompt assembly contains system prompt, citations, and conversation history."""
    chunk = DocumentChunk(
        chunk_id="c1",
        document_id="d1",
        filename="ai.pdf",
        file_type="pdf",
        page_number=3,
        section="Transformers",
        text="Self-attention allows tokens to attend to other tokens in parallel.",
        char_length=68,
    )
    results = [SearchResult(chunk=chunk, score=0.88, rank=1)]
    history = [ConversationMessage(role="user", content="Hello")]

    prompt = build_rag_prompt(
        question="How does self-attention work?",
        retrieved_results=results,
        conversation_history=history,
    )

    assert ACADEMIC_SYSTEM_PROMPT.strip() in prompt
    assert "[Source 1] Document: 'ai.pdf' | Page/Slide: 3 | Section: Transformers" in prompt
    assert "Self-attention allows tokens" in prompt
    assert "User: Hello" in prompt
    assert "STUDENT QUESTION:\nHow does self-attention work?" in prompt


def test_rag_service_generates_citations(populated_vector_store: FAISSVectorStore):
    """Verify that RAG generates verified citations with accurate page numbers."""
    rag_service = RAGService(vector_store=populated_vector_store)
    request = QARequest(
        question="How does backpropagation calculate gradients?",
        top_k=2,
        threshold=0.30,
    )

    response = rag_service.answer_question(request)

    assert isinstance(response, QAResponse)
    assert response.confidence_passed is True
    assert response.is_grounded is True
    assert len(response.sources) > 0

    top_citation = response.sources[0]
    assert isinstance(top_citation, Citation)
    assert top_citation.filename == "deep_learning_textbook.pdf"
    assert top_citation.page_number == 14
    assert top_citation.section == "Backpropagation Algorithm"
    assert "chain rule" in top_citation.passage
    assert top_citation.similarity_score > 0.40


def test_rag_low_confidence_rejection(populated_vector_store: FAISSVectorStore):
    """Verify that unrelated questions trigger the low-confidence fallback."""
    rag_service = RAGService(vector_store=populated_vector_store)
    request = QARequest(
        question="What is the capital of France and what pastries are famous?",
        top_k=5,
        threshold=0.55,  # Strict threshold that academic DL chunks will not satisfy
    )

    response = rag_service.answer_question(request)

    assert response.confidence_passed is False
    assert response.is_grounded is False
    assert len(response.sources) == 0
    assert response.answer == RAGService.LOW_CONFIDENCE_MESSAGE
