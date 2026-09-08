"""Generates realistic academic documents for evaluation benchmarking."""

import io
from pathlib import Path
import docx
import pptx
import pypdf


def generate_benchmark_corpus(output_dir: Path) -> None:
    """Create multi-format academic documents in output_dir."""
    output_dir.mkdir(parents=True, exist_ok=True)

    # 1. Plaintext Document: loss_optimization.txt
    txt_path = output_dir / "loss_optimization.txt"
    txt_path.write_text(
        "Optimization in Deep Learning: Stochastic Gradient Descent (SGD).\n\n"
        "The computational process of Stochastic Gradient Descent consists of three fundamental steps:\n"
        "First, perform a forward pass through the network to compute the loss between predicted outputs and ground truth.\n"
        "Second, execute a backward pass using backpropagation to compute the gradient of the loss with respect to all parameters.\n"
        "Third, update the weights by subtracting the product of the learning rate and the computed gradient.\n"
        "Mini-batch SGD balances variance and computational efficiency by computing gradients over subsets of training examples.",
        encoding="utf-8",
    )

    # 2. DOCX Document: transformer_nlp.docx
    docx_path = output_dir / "transformer_nlp.docx"
    doc = docx.Document()
    doc.add_heading("The Transformer Architecture in Natural Language Processing", level=1)
    doc.add_paragraph(
        "The Transformer architecture was introduced in 2017 by Vaswani et al. in the landmark paper 'Attention Is All You Need'. "
        "Unlike recurrent models such as LSTMs and GRUs, the Transformer eliminates recurrence entirely, relying exclusively on "
        "multi-head self-attention mechanisms to model relationships between tokens in parallel across sequence positions."
    )
    doc.add_heading("Scaled Dot-Product Attention Rationale", level=2)
    doc.add_paragraph(
        "In scaled dot-product attention, query and key vectors are multiplied and scaled by the square root of the key dimension, sqrt(d_k). "
        "The theoretical justification is that for large values of d_k, the dot products grow large in magnitude, pushing the softmax function "
        "into regions with extremely small gradients (vanishing gradients). Dividing by sqrt(d_k) stabilizes the variance of the dot products to 1.0."
    )
    doc.save(str(docx_path))

    # 3. PPTX Document: information_retrieval.pptx
    pptx_path = output_dir / "information_retrieval.pptx"
    prs = pptx.Presentation()

    # Slide 1: Dense vs. Sparse Search
    slide1 = prs.slides.add_slide(prs.slide_layouts[0])
    slide1.shapes.title.text = "Dense Semantic Retrieval vs. Sparse Keyword Search"
    slide1.placeholders[1].text = (
        "Sparse retrieval algorithms like TF-IDF and BM25 match exact keywords between query and documents.\n"
        "They suffer from the vocabulary mismatch problem when queries use synonyms not present in the document.\n"
        "Dense semantic retrieval encodes queries and passages into continuous embedding vectors using Sentence Transformers.\n"
        "Related concepts cluster closely in geometric vector space, enabling semantic retrieval even with zero overlapping words."
    )

    # Slide 2: Cosine Similarity and L2 Normalization
    slide2 = prs.slides.add_slide(prs.slide_layouts[1])
    slide2.shapes.title.text = "Cosine Similarity and Vector Dot Products"
    slide2.placeholders[1].text = (
        "Cosine similarity measures the angle between two vectors: cos(u, v) = (u . v) / (||u|| * ||v||).\n"
        "When vectors are L2-normalized during embedding generation, their Euclidean norm ||u|| = 1.0.\n"
        "Consequently, the denominator becomes exactly 1.0, and the inner product (dot product) equals cosine similarity.\n"
        "This allows high-speed similarity search using FAISS IndexFlatIP."
    )
    prs.save(str(pptx_path))

    # 4. PDF Document: deep_learning.pdf
    pdf_path = output_dir / "deep_learning.pdf"
    pdf_bytes = b"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length 260 >> stream
BT
/F1 12 Tf
72 720 Td
(Backpropagation in Deep Neural Networks) Tj
0 -24 Td
(Backpropagation is the primary algorithm used to train artificial neural networks.) Tj
0 -18 Td
(It computes the gradient of the loss function with respect to each weight by) Tj
0 -18 Td
(applying the chain rule of calculus in reverse order through the computational graph.) Tj
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
607
%%EOF"""
    pdf_path.write_bytes(pdf_bytes)


if __name__ == "__main__":
    import sys
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("evaluation/datasets/corpus")
    generate_benchmark_corpus(out)
    print(f"Corpus successfully generated in: {out}")
