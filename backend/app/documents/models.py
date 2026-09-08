"""Data models for document ingestion and text extraction."""

from typing import Any, Dict, List
from pydantic import BaseModel, Field


class ExtractedPage(BaseModel):
    """Represents text and metadata extracted from a discrete page, slide, or section."""

    page_number: int = Field(
        ...,
        ge=1,
        description="Physical 1-indexed page or slide number within the document.",
    )
    text: str = Field(
        ...,
        description="Raw extracted textual content for this specific page or slide.",
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Supplemental structural metadata (e.g. section title, slide title).",
    )


class ExtractedDocument(BaseModel):
    """Represents a fully ingested document comprising one or more extracted pages."""

    document_id: str = Field(
        ...,
        description="Unique deterministic identifier (SHA-256 hash) for the document.",
    )
    filename: str = Field(
        ...,
        description="Original name of the uploaded document file.",
    )
    file_type: str = Field(
        ...,
        description="Normalized file extension/type (pdf, docx, pptx, txt).",
    )
    total_pages: int = Field(
        ...,
        ge=1,
        description="Total count of extracted pages or slides.",
    )
    pages: List[ExtractedPage] = Field(
        ...,
        description="List of extracted page models in sequential order.",
    )

    @property
    def full_text(self) -> str:
        """Convenience property concatenating text across all pages."""
        return "\n\n".join(page.text for page in self.pages if page.text.strip())
