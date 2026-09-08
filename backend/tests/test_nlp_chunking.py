"""Unit tests for Phase 3: Text Cleaning and Intelligent Chunking."""

import pytest
from backend.app.documents.models import ExtractedDocument, ExtractedPage
from backend.app.nlp.cleaner import TextCleaner
from backend.app.nlp.chunker import IntelligentChunker
from backend.app.nlp.models import DocumentChunk


def test_text_cleaner_whitespace_and_newlines():
    """Verify that multiple spaces, tabs, and excess newlines are normalized."""
    raw_text = "Natural   Language    Processing.\n\n\n\nIt  enables   computers   to understand."
    cleaned = TextCleaner.clean(raw_text)
    assert cleaned == "Natural Language Processing.\n\nIt enables computers to understand."


def test_text_cleaner_hyphenation_wrap():
    """Verify that broken words across linebreaks are reconnected."""
    raw_text = "We study the trans-\n former architec-\n ture."
    cleaned = TextCleaner.clean(raw_text)
    assert "transformer" in cleaned
    assert "architecture" in cleaned


def test_chunker_invalid_configuration():
    """Verify that chunk_overlap >= chunk_size raises ValueError."""
    with pytest.raises(ValueError, match="strictly less than"):
        IntelligentChunker(chunk_size=100, chunk_overlap=100)


def test_chunker_generates_valid_metadata():
    """Verify that chunks retain document_id, filename, file_type, and page_number."""
    doc = ExtractedDocument(
        document_id="doc_test_123",
        filename="lecture.pdf",
        file_type="pdf",
        total_pages=2,
        pages=[
            ExtractedPage(
                page_number=1,
                text="Page 1 discusses backpropagation and gradient descent optimization in deep networks.",
                metadata={"section": "Optimization"},
            ),
            ExtractedPage(
                page_number=2,
                text="Page 2 discusses self-attention and transformer encoders for natural language tasks.",
                metadata={"section": "Transformers"},
            ),
        ],
    )

    chunker = IntelligentChunker(chunk_size=200, chunk_overlap=30)
    chunks = chunker.chunk_document(doc)

    assert len(chunks) == 2
    assert isinstance(chunks[0], DocumentChunk)
    assert chunks[0].document_id == "doc_test_123"
    assert chunks[0].filename == "lecture.pdf"
    assert chunks[0].page_number == 1
    assert chunks[0].section == "Optimization"
    assert chunks[0].chunk_id == "doc_test_123_p1_c001"

    assert chunks[1].page_number == 2
    assert chunks[1].section == "Transformers"
    assert chunks[1].chunk_id == "doc_test_123_p2_c001"


def test_chunker_splits_oversized_paragraph():
    """Verify that large text blocks are split into multiple chunks with overlap."""
    large_paragraph = (
        "Artificial intelligence is transforming science. "
        "Deep learning models achieve state-of-the-art results on benchmark tasks. "
        "Natural language processing allows automated question answering and semantic retrieval. "
        "Vector embeddings represent conceptual meaning in high-dimensional vector spaces. "
        "FAISS enables scalable nearest neighbor lookup in milliseconds."
    )

    page = ExtractedPage(page_number=1, text=large_paragraph)
    chunker = IntelligentChunker(chunk_size=120, chunk_overlap=25)
    chunks = chunker.chunk_page(
        page=page,
        document_id="doc_ai_01",
        filename="ai.txt",
        file_type="txt",
    )

    assert len(chunks) > 1
    for chunk in chunks:
        assert chunk.document_id == "doc_ai_01"
        assert chunk.page_number == 1
        assert len(chunk.text) <= 150  # comfortably near budget
