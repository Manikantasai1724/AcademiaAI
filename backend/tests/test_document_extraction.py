"""Unit and Integration Tests for Document Ingestion & Text Extraction (Phase 2)."""

import io
from pathlib import Path
import pytest
import docx
import pptx
import pypdf

from backend.app.documents import DocumentIngestionService, ExtractedDocument


@pytest.fixture
def sample_txt_file(tmp_path: Path) -> Path:
    """Fixture creating a temporary academic plaintext file."""
    file_path = tmp_path / "nlp_notes.txt"
    content = (
        "Natural Language Processing (NLP) is a branch of artificial intelligence.\n"
        "It enables computers to understand human language.\n"
        "Key tasks include semantic search, question answering, and text classification."
    )
    file_path.write_text(content, encoding="utf-8")
    return file_path


@pytest.fixture
def sample_docx_file(tmp_path: Path) -> Path:
    """Fixture creating a temporary academic Word document."""
    file_path = tmp_path / "deep_learning.docx"
    doc = docx.Document()
    doc.add_heading("Section 1: Neural Network Foundations", level=1)
    doc.add_paragraph("Backpropagation is the foundational algorithm for calculating gradients.")
    table = doc.add_table(rows=2, cols=2)
    table.cell(0, 0).text = "Layer"
    table.cell(0, 1).text = "Activation"
    table.cell(1, 0).text = "Dense"
    table.cell(1, 1).text = "ReLU"
    doc.save(str(file_path))
    return file_path


@pytest.fixture
def sample_pptx_file(tmp_path: Path) -> Path:
    """Fixture creating a temporary 2-slide presentation."""
    file_path = tmp_path / "transformer_lecture.pptx"
    prs = pptx.Presentation()

    # Slide 1
    slide1 = prs.slides.add_slide(prs.slide_layouts[0])
    slide1.shapes.title.text = "Transformer Architecture"
    slide1.placeholders[1].text = "Attention Is All You Need introduced self-attention."

    # Slide 2
    slide2 = prs.slides.add_slide(prs.slide_layouts[1])
    slide2.shapes.title.text = "Scaled Dot-Product Attention"
    slide2.placeholders[1].text = "Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) V"

    prs.save(str(file_path))
    return file_path


@pytest.fixture
def sample_pdf_file(tmp_path: Path) -> Path:
    """Fixture creating a temporary 1-page valid PDF document."""
    file_path = tmp_path / "academic_paper.pdf"
    pdf_bytes = b"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length 53 >> stream
BT
/F1 12 Tf
72 712 Td
(Semantic Search using Sentence Transformers) Tj
ET
endstream endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000227 00000 n 
0000000297 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
400
%%EOF"""
    file_path.write_bytes(pdf_bytes)
    return file_path


def test_extract_txt(sample_txt_file: Path):
    """Verify plaintext extraction produces valid ExtractedDocument with 1 page."""
    doc = DocumentIngestionService.extract_document(sample_txt_file)
    assert isinstance(doc, ExtractedDocument)
    assert doc.file_type == "txt"
    assert doc.total_pages == 1
    assert len(doc.pages) == 1
    assert doc.pages[0].page_number == 1
    assert "Natural Language Processing" in doc.pages[0].text
    assert doc.document_id.startswith("doc_")


def test_extract_docx(sample_docx_file: Path):
    """Verify DOCX extraction captures headings, paragraphs, and table contents."""
    doc = DocumentIngestionService.extract_document(sample_docx_file)
    assert isinstance(doc, ExtractedDocument)
    assert doc.file_type == "docx"
    assert doc.total_pages >= 1
    assert "Backpropagation" in doc.full_text
    assert "[Table Content]" in doc.full_text
    assert "ReLU" in doc.full_text
    assert doc.pages[0].metadata.get("section") == "Section 1: Neural Network Foundations"


def test_extract_pptx(sample_pptx_file: Path):
    """Verify PPTX extraction preserves slide-by-slide numbering and content."""
    doc = DocumentIngestionService.extract_document(sample_pptx_file)
    assert isinstance(doc, ExtractedDocument)
    assert doc.file_type == "pptx"
    assert doc.total_pages == 2
    assert doc.pages[0].page_number == 1
    assert "Transformer Architecture" in doc.pages[0].text
    assert doc.pages[1].page_number == 2
    assert "Scaled Dot-Product Attention" in doc.pages[1].text


def test_extract_pdf(sample_pdf_file: Path):
    """Verify PDF extraction captures page text and sets physical page numbers."""
    doc = DocumentIngestionService.extract_document(sample_pdf_file)
    assert isinstance(doc, ExtractedDocument)
    assert doc.file_type == "pdf"
    assert doc.total_pages == 1
    assert doc.pages[0].page_number == 1
    assert "Semantic Search using Sentence Transformers" in doc.pages[0].text


def test_deterministic_document_id(sample_txt_file: Path):
    """Verify that the same file yields the exact same document ID (idempotent hashing)."""
    doc1 = DocumentIngestionService.extract_document(sample_txt_file)
    doc2 = DocumentIngestionService.extract_document(sample_txt_file)
    assert doc1.document_id == doc2.document_id


def test_unsupported_format_rejection(tmp_path: Path):
    """Verify that unsupported file extensions raise ValueError with supported list."""
    unsupported_file = tmp_path / "script.exe"
    unsupported_file.write_bytes(b"MZBINARY")

    with pytest.raises(ValueError, match="Unsupported file format '.exe'"):
        DocumentIngestionService.extract_document(unsupported_file)


def test_nonexistent_file_rejection(tmp_path: Path):
    """Verify that a missing file path raises FileNotFoundError."""
    missing_file = tmp_path / "non_existent.pdf"
    with pytest.raises(FileNotFoundError):
        DocumentIngestionService.extract_document(missing_file)
