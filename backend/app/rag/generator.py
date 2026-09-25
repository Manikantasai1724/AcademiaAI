"""RAG Answer Generation Service using Gemini and FAISS retrieval.

Implements strict grounding, confidence thresholding, and verifiable source citations.
"""

import logging
from typing import List, Optional
import google.generativeai as genai

from backend.app.core.config import settings
from backend.app.embeddings import EmbeddingManager
from backend.app.rag.models import Citation, QARequest, QAResponse
from backend.app.rag.prompts import build_rag_prompt
from backend.app.retrieval import FAISSVectorStore, SearchResult

logger = logging.getLogger(__name__)


class RAGService:
    """Orchestrates retrieval, confidence thresholding, prompt assembly, and Gemini generation."""

    LOW_CONFIDENCE_MESSAGE = (
        "I couldn't find sufficient information about this question in the provided academic materials."
    )

    def __init__(
        self,
        vector_store: FAISSVectorStore,
        embedding_manager: Optional[EmbeddingManager] = None,
    ):
        self.vector_store = vector_store
        self.embedding_manager = embedding_manager or EmbeddingManager.get_instance()
        self._gemini_initialized = False

    def _init_gemini(self) -> bool:
        """Initialize Google Gemini SDK with configured API key."""
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.strip() == "your_gemini_api_key_here":
            return False
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self._gemini_initialized = True
            return True
        except Exception as e:
            logger.error("Failed to configure Gemini API: %s", e)
            return False

    def answer_question(self, request: QARequest) -> QAResponse:
        """Answer a student's question using strictly retrieved academic chunks."""
        # 1. Generate query embedding
        query_vector = self.embedding_manager.encode_text(request.question)

        # 2. Retrieve top-K relevant chunks above threshold
        results: List[SearchResult] = self.vector_store.search(
            query_vector=query_vector,
            top_k=request.top_k or settings.TOP_K,
            threshold=request.threshold if request.threshold is not None else settings.SIMILARITY_THRESHOLD,
        )

        # 3. Phase 8: Low-Confidence Handling
        if not results:
            return QAResponse(
                question=request.question,
                answer=self.LOW_CONFIDENCE_MESSAGE,
                sources=[],
                is_grounded=False,
                confidence_passed=False,
                total_retrieved=0,
            )

        # 4. Phase 7: Application-level verified citations (not hallucinated by LLM)
        citations: List[Citation] = []
        for idx, res in enumerate(results, start=1):
            citations.append(
                Citation(
                    source_number=idx,
                    filename=res.chunk.filename,
                    page_number=res.chunk.page_number,
                    section=res.chunk.section,
                    chunk_id=res.chunk.chunk_id,
                    passage=res.chunk.text,
                    similarity_score=res.score,
                )
            )

        # 5. Phase 6: Build prompt & call Gemini for grounded synthesis
        prompt = build_rag_prompt(
            question=request.question,
            retrieved_results=results,
            conversation_history=request.conversation_history,
        )

        answer_text = self._generate_with_gemini(prompt, results)

        return QAResponse(
            question=request.question,
            answer=answer_text,
            sources=citations,
            is_grounded=True,
            confidence_passed=True,
            total_retrieved=len(results),
        )

    def _generate_with_gemini(self, prompt: str, results: List[SearchResult]) -> str:
        """Call Gemini API, falling back across models or to top passage if quota is exhausted."""
        if not self._gemini_initialized and not self._init_gemini():
            # Graceful educational fallback when running offline or without API key
            top_chunk = results[0].chunk
            return (
                f"[Offline / Grounded Mode] Based on {top_chunk.filename} (Page {top_chunk.page_number}):\n\n"
                f"{top_chunk.text}\n\n"
                f"(Note: To enable generative natural language synthesis with Gemini, "
                f"please set your GEMINI_API_KEY in the .env file)."
            )

        candidate_models = [
            settings.GEMINI_MODEL_NAME,
            "gemini-3.5-flash",
            "gemini-3-flash-preview",
            "gemini-3.1-flash-lite",
        ]
        # Deduplicate while preserving order
        candidate_models = list(dict.fromkeys(candidate_models))

        last_error = None
        for model_name in candidate_models:
            try:
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(prompt)
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                last_error = e
                logger.warning(
                    "Gemini generation call failed on model %s (%s). Attempting fallback...",
                    model_name,
                    e,
                )

        logger.error("All Gemini candidate models failed, falling back to top passage: %s", last_error)
        top_chunk = results[0].chunk
        return (
            f"Based on {top_chunk.filename} (Page {top_chunk.page_number}):\n\n"
            f"{top_chunk.text}\n\n"
            f"[LLM generation notice: {str(last_error)}]"
        )
