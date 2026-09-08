"""Retrieval-Augmented Generation (RAG) and Gemini synthesis package."""

from .models import Citation, ConversationMessage, QARequest, QAResponse
from .prompts import ACADEMIC_SYSTEM_PROMPT, build_rag_prompt
from .generator import RAGService

__all__ = [
    "Citation",
    "ConversationMessage",
    "QARequest",
    "QAResponse",
    "ACADEMIC_SYSTEM_PROMPT",
    "build_rag_prompt",
    "RAGService",
]
