# Academic NLP Question Answering & Semantic Search System

An academic-grade, end-to-end Natural Language Processing system for scholarly document ingestion, semantic vector search, and grounded Question Answering powered by Sentence Transformers, FAISS, and Gemini Retrieval-Augmented Generation (RAG).

---

## Technical Overview

* **Dense Semantic Embeddings**: `sentence-transformers/all-mpnet-base-v2` (768-dimensional dense representations)
* **Vector Index & Similarity**: FAISS (Facebook AI Similarity Search) with inner-product cosine similarity
* **Grounding & Answer Synthesis**: Google Gemini LLM conditioned strictly on retrieved document chunks
* **Backend Framework**: Python 3.14+, FastAPI, Pydantic v2
* **Frontend**: React, TypeScript, Vite, Tailwind CSS (Phase 10)

---

## Project Structure

```text
├── backend/
│   ├── app/
│   │   ├── api/            # REST API endpoints & route controllers (Phase 9)
│   │   ├── core/           # Configuration, settings & logging (Phase 1)
│   │   ├── documents/      # Multi-format document ingestion: PDF, DOCX, PPTX, TXT (Phase 2)
│   │   ├── nlp/            # Text cleaning & intelligent chunking (Phase 3)
│   │   ├── embeddings/     # Sentence Transformer embedding manager (Phase 4)
│   │   ├── retrieval/      # FAISS vector store & similarity search (Phase 5)
│   │   ├── rag/            # Prompt engineering & Gemini generation (Phase 6)
│   │   ├── evaluation/     # Retrieval metrics: Precision@K, Recall@K, MRR (Phase 11)
│   │   └── main.py         # FastAPI application entrypoint
│   └── tests/              # Automated test suite
├── docs/
│   ├── architecture.md     # System architecture & mathematical foundations
│   ├── methodology.md      # NLP theory and chunking rationale
│   └── evaluation.md       # Empirical benchmark definitions
├── evaluation/
│   ├── datasets/           # Curated academic question-answering evaluation datasets
│   └── results/            # Benchmark execution metrics
├── data/
│   ├── uploads/            # Ingested raw academic documents
│   └── faiss/              # Serialized FAISS vector index and metadata store
├── .env.example            # Environment variables template
├── .gitignore              # Version control ignore definitions
└── requirements.txt        # Backend dependencies
```

---

## Getting Started

### 1. Environment Configuration
Copy the environment template:
```bash
cp .env.example .env
```
Provide your `GEMINI_API_KEY` in `.env`.

### 2. Run Validation Tests
Run the Phase 1 test suite:
```bash
pytest backend/tests/test_environment.py -v
```

### 3. Start Backend Server
```bash
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```
Interactive Swagger documentation is available at `http://127.0.0.1:8000/docs`.
