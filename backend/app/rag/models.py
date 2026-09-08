"""Data models for Citations, Conversational Memory, and RAG QA Requests/Responses."""

from typing import List, Optional
from pydantic import BaseModel, Field


class Citation(BaseModel):
    """Immutable citation generated from retrieved metadata (not guessed by LLM)."""

    source_number: int = Field(
        ...,
        ge=1,
        description="Sequential index of the citation in the answer context.",
    )
    filename: str = Field(
        ...,
        description="Source document name.",
    )
    page_number: int = Field(
        ...,
        ge=1,
        description="Physical page or slide number where the passage appears.",
    )
    section: Optional[str] = Field(
        default=None,
        description="Section title or slide header if available.",
    )
    chunk_id: str = Field(
        ...,
        description="Identifier of the specific chunk.",
    )
    passage: str = Field(
        ...,
        description="Exact retrieved passage text available for user inspection.",
    )
    similarity_score: float = Field(
        ...,
        description="Cosine similarity score for this citation.",
    )


class ConversationMessage(BaseModel):
    """Single turn in a short conversational memory window."""

    role: str = Field(
        ...,
        description="Role of the speaker: 'user' or 'assistant'.",
    )
    content: str = Field(
        ...,
        description="Message textual content.",
    )


class QARequest(BaseModel):
    """Payload for asking a question over indexed academic documents."""

    question: str = Field(
        ...,
        description="The student's natural language question.",
    )
    top_k: Optional[int] = Field(
        default=None,
        description="Maximum number of chunks to retrieve (defaults to settings.TOP_K).",
    )
    threshold: Optional[float] = Field(
        default=None,
        description="Minimum similarity score threshold (defaults to settings.SIMILARITY_THRESHOLD).",
    )
    conversation_history: Optional[List[ConversationMessage]] = Field(
        default_factory=list,
        description="Recent conversation turns (capped at last 3 turns).",
    )


class QAResponse(BaseModel):
    """Structured response containing grounded answer, citations, and confidence status."""

    question: str = Field(
        ...,
        description="Original question asked.",
    )
    answer: str = Field(
        ...,
        description="Grounded educational answer synthesized by Gemini.",
    )
    sources: List[Citation] = Field(
        default_factory=list,
        description="List of verified citations derived from retrieved chunks.",
    )
    is_grounded: bool = Field(
        ...,
        description="True if the answer was generated from retrieved academic context.",
    )
    confidence_passed: bool = Field(
        ...,
        description="True if retrieval satisfied the similarity threshold.",
    )
    total_retrieved: int = Field(
        ...,
        description="Number of chunks retrieved above the threshold.",
    )
