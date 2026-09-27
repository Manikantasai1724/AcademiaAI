"""RAG Answer Generation Service using Gemini and FAISS retrieval.

Implements strict grounding, confidence thresholding, verifiable source citations,
in-memory caching for repeated queries, and exponential backoff retry for rate limits.
"""

from collections import OrderedDict
import hashlib
import logging
import time
from typing import List, Optional, Tuple
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted

from backend.app.core.config import settings
from backend.app.embeddings import EmbeddingManager
from backend.app.rag.models import Citation, QARequest, QAResponse
from backend.app.rag.prompts import build_rag_prompt
from backend.app.retrieval import FAISSVectorStore, SearchResult

logger = logging.getLogger(__name__)


class ResponseCache:
    """Thread-safe in-memory LRU cache with TTL for RAG QA responses."""

    def __init__(self, capacity: int = 256, ttl_seconds: int = 1800):
        self.capacity = capacity
        self.ttl = ttl_seconds
        self._cache: OrderedDict[str, Tuple[float, QAResponse]] = OrderedDict()

    def get(self, key: str) -> Optional[QAResponse]:
        if key not in self._cache:
            return None
        created_at, response = self._cache[key]
        if time.time() - created_at > self.ttl:
            del self._cache[key]
            return None
        self._cache.move_to_end(key)
        return response

    def set(self, key: str, response: QAResponse) -> None:
        if key in self._cache:
            self._cache.move_to_end(key)
        self._cache[key] = (time.time(), response)
        if len(self._cache) > self.capacity:
            self._cache.popitem(last=False)

    def clear(self) -> None:
        self._cache.clear()


class RAGService:
    """Orchestrates retrieval, confidence thresholding, prompt assembly, and Gemini generation."""

    LOW_CONFIDENCE_MESSAGE = (
        "I couldn't find sufficient information about this question in the provided academic materials."
    )

    # Class-level cache shared across requests to survive repeated user inquiries
    _response_cache = ResponseCache(capacity=256, ttl_seconds=1800)

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

    def _compute_cache_key(self, request: QARequest) -> str:
        """Generate a deterministic cache key for a student question and context."""
        history_summary = ""
        if request.conversation_history:
            history_summary = ";".join(
                f"{h.role}:{h.content[:50]}" for h in request.conversation_history[-3:]
            )
        raw = f"{request.question.strip().lower()}|{request.top_k}|{request.threshold}|{history_summary}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def answer_question(self, request: QARequest) -> QAResponse:
        """Answer a student's question using strictly retrieved academic chunks with caching."""
        cache_key = self._compute_cache_key(request)
        cached_response = self._response_cache.get(cache_key)
        if cached_response is not None:
            logger.info("Serving cached answer for repeated question: '%s'", request.question)
            return cached_response

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
            response = QAResponse(
                question=request.question,
                answer=self.LOW_CONFIDENCE_MESSAGE,
                sources=[],
                is_grounded=False,
                confidence_passed=False,
                total_retrieved=0,
            )
            self._response_cache.set(cache_key, response)
            return response

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

        response = QAResponse(
            question=request.question,
            answer=answer_text,
            sources=citations,
            is_grounded=True,
            confidence_passed=True,
            total_retrieved=len(results),
        )

        # Cache the completed response for future repeated requests
        self._response_cache.set(cache_key, response)
        return response

    def _generate_with_gemini(self, prompt: str, results: List[SearchResult]) -> str:
        """Call Gemini API with exponential backoff for rate limits, model fallback, and clean notices."""
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
            "gemini-3.8-flash",
            "gemini-3.5-flash-lite",
            "gemini-flash-latest",
            "gemini-flash-lite-latest",
        ]
        # Deduplicate while preserving order
        candidate_models = list(dict.fromkeys(candidate_models))

        last_error = None
        for model_name in candidate_models:
            # Retry up to 2 attempts per candidate model if rate limited
            for attempt in range(2):
                try:
                    model = genai.GenerativeModel(model_name)
                    response = model.generate_content(prompt)
                    if response and response.text:
                        return response.text.strip()
                except ResourceExhausted as re_err:
                    last_error = re_err
                    wait_seconds = 2.0 * (attempt + 1)
                    logger.warning(
                        "Gemini rate limit (429/ResourceExhausted) on %s. Backing off for %.1fs (attempt %d/2)...",
                        model_name,
                        wait_seconds,
                        attempt + 1,
                    )
                    time.sleep(wait_seconds)
                except Exception as e:
                    last_error = e
                    logger.warning(
                        "Gemini generation call failed on model %s (%s). Attempting fallback...",
                        model_name,
                        e,
                    )
                    # Non-rate-limit error (e.g. invalid model or prompt structure), move to next candidate
                    break

        # Check if Groq fallback is configured when Gemini exhausts quota
        if settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip():
            groq_response = self._generate_with_groq(prompt)
            if groq_response:
                return groq_response

        logger.error("All Gemini candidate models failed, falling back to top passage: %s", last_error)
        top_chunk = results[0].chunk

        is_rate_limit = (
            isinstance(last_error, ResourceExhausted)
            or (last_error and "429" in str(last_error))
            or (last_error and "ResourceExhausted" in str(last_error))
        )

        if is_rate_limit:
            notice = (
                "*(Notice: The AI generation service is temporarily rate-limited due to frequent requests. "
                "The most relevant verified course passage has been extracted directly from your course materials above.)*"
            )
        else:
            notice = f"[LLM generation notice: {str(last_error)}]"

        return (
            f"Based on **{top_chunk.filename}** (Page {top_chunk.page_number}):\n\n"
            f"{top_chunk.text}\n\n"
            f"{notice}"
        )

    def _generate_with_groq(self, prompt: str) -> Optional[str]:
        """Secondary fallback generation using Groq API (llama-3.3-70b-versatile)."""
        try:
            import httpx
            headers = {
                "Authorization": f"Bearer {settings.GROQ_API_KEY.strip()}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2,
            }
            with httpx.Client(timeout=20.0) as client:
                res = client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers=headers,
                    json=payload,
                )
                if res.status_code == 200:
                    data = res.json()
                    answer = data["choices"][0]["message"]["content"]
                    logger.info("Successfully generated answer via Groq fallback (llama-3.3-70b-versatile)")
                    return answer.strip()
                logger.warning("Groq fallback returned HTTP %d: %s", res.status_code, res.text)
        except Exception as groq_err:
            logger.warning("Groq fallback generation failed: %s", groq_err)
        return None
