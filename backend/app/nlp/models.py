"""Data models for cleaned text chunks and chunk metadata."""

from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class DocumentChunk(BaseModel):
    """Atomic unit of retrieval preserving semantic text and source provenance."""

    chunk_id: str = Field(
        ...,
        description="Unique identifier for this chunk (e.g. chunk_doc_001_p1_01).",
    )
    document_id: str = Field(
        ...,
        description="ID of the parent document from which this chunk was extracted.",
    )
    filename: str = Field(
        ...,
        description="Original name of the source document.",
    )
    file_type: str = Field(
        ...,
        description="File extension/type (pdf, docx, pptx, txt).",
    )
    page_number: int = Field(
        ...,
        ge=1,
        description="1-indexed physical page or slide number where this passage resides.",
    )
    section: Optional[str] = Field(
        default=None,
        description="Section heading or slide title if detected during extraction.",
    )
    text: str = Field(
        ...,
        description="Cleaned, natural text content of this chunk ready for embedding.",
    )
    char_length: int = Field(
        ...,
        description="Character count of the chunk text.",
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional contextual metadata.",
    )
