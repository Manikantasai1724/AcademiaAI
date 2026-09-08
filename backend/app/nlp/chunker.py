"""Intelligent, paragraph-aware text chunking engine.

Segments extracted pages into coherent chunks preserving semantic continuity,
configurable overlap, and granular document/page metadata.
"""

import re
from typing import List, Optional

from backend.app.documents.models import ExtractedDocument, ExtractedPage
from backend.app.nlp.cleaner import TextCleaner
from backend.app.nlp.models import DocumentChunk


class IntelligentChunker:
    """Chunks documents using paragraph and sentence boundaries with configurable overlap."""

    # Sentence splitting regex respecting common punctuation
    SENTENCE_SPLIT_PATTERN = re.compile(r"(?<=[.?!])\s+(?=[A-Z0-9])")

    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        if chunk_overlap >= chunk_size:
            raise ValueError("chunk_overlap must be strictly less than chunk_size.")
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_document(self, document: ExtractedDocument) -> List[DocumentChunk]:
        """Convert a complete ExtractedDocument into an ordered list of DocumentChunks."""
        all_chunks: List[DocumentChunk] = []

        for page in document.pages:
            page_chunks = self.chunk_page(
                page=page,
                document_id=document.document_id,
                filename=document.filename,
                file_type=document.file_type,
            )
            all_chunks.extend(page_chunks)

        return all_chunks

    def chunk_page(
        self,
        page: ExtractedPage,
        document_id: str,
        filename: str,
        file_type: str,
    ) -> List[DocumentChunk]:
        """Chunk an individual page while preserving its page number and section context."""
        cleaned_text = TextCleaner.clean(page.text)
        if not cleaned_text:
            return []

        section = page.metadata.get("section") or page.metadata.get("slide_title")
        raw_chunks_text = self._split_text(cleaned_text)

        chunks: List[DocumentChunk] = []
        for idx, text in enumerate(raw_chunks_text):
            chunk_id = f"{document_id}_p{page.page_number}_c{idx + 1:03d}"
            chunks.append(
                DocumentChunk(
                    chunk_id=chunk_id,
                    document_id=document_id,
                    filename=filename,
                    file_type=file_type,
                    page_number=page.page_number,
                    section=section,
                    text=text,
                    char_length=len(text),
                    metadata=page.metadata,
                )
            )

        return chunks

    def _split_text(self, text: str) -> List[str]:
        """Split text into chunks respecting paragraphs and sentences with overlap."""
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        if not paragraphs:
            return []

        chunks: List[str] = []
        current_chunk: str = ""

        for para in paragraphs:
            # If the single paragraph itself is larger than chunk_size, split by sentences
            if len(para) > self.chunk_size:
                if current_chunk:
                    chunks.append(current_chunk)
                    current_chunk = ""
                sentence_chunks = self._split_large_paragraph(para)
                for sc in sentence_chunks:
                    chunks.append(sc)
            elif not current_chunk:
                current_chunk = para
            elif len(current_chunk) + len(para) + 2 <= self.chunk_size:
                current_chunk = f"{current_chunk}\n\n{para}"
            else:
                chunks.append(current_chunk)
                overlap_prefix = self._get_overlap_prefix(current_chunk)
                current_chunk = f"{overlap_prefix}\n\n{para}".strip() if overlap_prefix else para

        if current_chunk:
            chunks.append(current_chunk)

        return chunks

    def _split_large_paragraph(self, paragraph: str) -> List[str]:
        """Split an oversize paragraph by sentence boundaries with overlap."""
        sentences = self.SENTENCE_SPLIT_PATTERN.split(paragraph)
        chunks: List[str] = []
        current = ""

        for sent in sentences:
            sent = sent.strip()
            if not sent:
                continue

            if not current:
                current = sent
            elif len(current) + len(sent) + 1 <= self.chunk_size:
                current = f"{current} {sent}"
            else:
                chunks.append(current)
                overlap = self._get_overlap_prefix(current)
                current = f"{overlap} {sent}".strip() if overlap else sent

        if current:
            chunks.append(current)

        return chunks

    def _get_overlap_prefix(self, text: str) -> str:
        """Extract a trailing slice of text to serve as the overlap prefix."""
        if len(text) <= self.chunk_overlap:
            return text
        # Attempt to slice from a word boundary near chunk_overlap
        overlap_slice = text[-self.chunk_overlap:]
        space_idx = overlap_slice.find(" ")
        if space_idx != -1 and space_idx < len(overlap_slice) - 1:
            return overlap_slice[space_idx + 1:].strip()
        return overlap_slice.strip()
