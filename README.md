# AcademiaAI — Intelligent Academic Research & Literature Assistant

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Bundler-Vite-646CFF.svg?style=flat&logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20v4-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![FAISS](https://img.shields.io/badge/Vector%20Store-FAISS%20IndexFlatIP-blue.svg?style=flat)](https://github.com/facebookresearch/faiss)
[![SentenceTransformers](https://img.shields.io/badge/Embeddings-all--mpnet--base--v2-orange.svg?style=flat)](https://huggingface.co/sentence-transformers/all-mpnet-base-v2)

**AcademiaAI** is a student- and researcher-focused Question Answering and Semantic Literature Search platform. It combines dense semantic vector retrieval (`all-mpnet-base-v2` + FAISS) with Retrieval-Augmented Generation (RAG) powered by Google Gemini to provide **verifiable, hallucination-free answers with exact page, slide, and paragraph citations**.

---

## 🌟 Key Capabilities

* **Grounded Question Answering (RAG)**: Synthesizes comprehensive academic answers conditioned strictly on your uploaded materials, complete with verifiable page and passage citations.
* **Semantic Vector Search**: Concept-driven literature search powered by dense embeddings that uncover relevant passages across your files even when exact keywords differ.
* **Multi-Format Ingestion**: Supports `.pdf` (textbooks & papers), `.pptx` (lecture slide decks), `.docx` (notes & manuscripts), and `.txt` files with structure and formula preservation.
* **Smart Passage Chunking**: Preserves syntactic sentence and paragraph boundaries to retain academic context and citation precision.
* **Inspection & Provenance**: Interactive excerpt inspector allowing researchers to inspect raw retrieved text, similarity scores, and document metadata.
* **Strict Academic Privacy**: Ingested files remain local and are never used to train public language models.
* **Modern Scholastic Interface**: Clean, responsive interface featuring light/dark mode, precision threshold sliders, and real-time indexing status.

---

## 🏗️ System Architecture

```text
  [ User Upload: PDF, DOCX, PPTX, TXT ]
                  │
                  ▼
  [ Document Ingestion & Structure Parser ]
                  │
                  ▼
  [ Syntactic Boundary Chunking & Preprocessing ]
                  │
                  ▼
  [ Embedding Generation: all-mpnet-base-v2 (768-dim) ]
                  │
                  ▼
  [ In-Memory & Disk Serialized FAISS Vector Store ]
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
  [ Semantic Search ]   [ Grounded Q&A Assistant ]
  (Cosine Similarity)   (Top-K Chunks + Gemini LLM)
                            │
                            ▼
              [ Verified Answer with Citations ]
```

---

## 📁 Project Structure

```text
NLP/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py          # REST API endpoints (Upload, Q&A, Search, Library)
│   │   ├── core/
│   │   │   └── config.py          # Settings, models, and path configurations
│   │   ├── documents/
│   │   │   └── parser.py          # Multi-format extractors (PyPDF, python-docx, python-pptx)
│   │   ├── embeddings/
│   │   │   └── manager.py         # SentenceTransformer all-mpnet-base-v2 embedder
│   │   ├── nlp/
│   │   │   └── chunker.py         # Boundary-preserving academic text chunker
│   │   ├── rag/
│   │   │   └── generator.py       # Grounded prompt engineering & Gemini synthesis
│   │   ├── retrieval/
│   │   │   └── vector_store.py    # FAISS IndexFlatIP vector database & metadata
│   │   └── main.py                # FastAPI app initialization and CORS setup
│   └── tests/                     # Automated test suites
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx                 # Header navigation, status, and theme toggle
│   │   │   ├── DocumentUpload.tsx         # Drag-and-drop file ingestion interface
│   │   │   ├── QASection.tsx              # Research Q&A assistant with citations
│   │   │   ├── SemanticSearchSection.tsx  # Literature & concept search explorer
│   │   │   ├── DocumentLibrary.tsx        # Source files manager & excerpt drawer
│   │   │   └── ChunkInspectorModal.tsx    # Passage inspector modal with copy tool
│   │   ├── services/
│   │   │   └── api.ts             # Axios client for FastAPI communication
│   │   ├── types/
│   │   │   └── index.ts           # Shared TypeScript interfaces
│   │   ├── App.tsx                # Main application workspace layout
│   │   ├── index.css              # Custom themes, typography & Tailwind styling
│   │   └── main.tsx               # React entry point
│   ├── index.html                 # HTML template with Plus Jakarta Sans & Inter
│   ├── package.json               # Frontend dependencies & scripts
│   └── vite.config.ts             # Vite configuration with Tailwind CSS v4
├── data/
│   ├── uploads/                   # Local storage for uploaded documents
│   └── faiss/                     # Serialized FAISS index and chunk metadata
├── run_backend.bat                # One-click Windows startup script for backend
├── run_frontend.bat               # One-click Windows startup script for frontend
├── requirements.txt               # Python backend dependencies
└── README.md                      # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

* **Python 3.10+** (Python 3.11 / 3.12 / 3.14 compatible)
* **Node.js 18+** and **npm**
* A **Google Gemini API Key** ([Google AI Studio](https://aistudio.google.com/))

---

### Step 1: Clone & Configure Environment

1. Clone the repository:
   ```bash
   git clone https://github.com/Manikantasai1724/AcademiaAI.git
   cd AcademiaAI
   ```

2. Create and configure your `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API Key in `.env`:
   ```env
   GEMINI_API_KEY="your-google-gemini-api-key"
   GEMINI_MODEL="gemini-2.5-flash"
   EMBEDDING_MODEL="sentence-transformers/all-mpnet-base-v2"
   ```

---

### Step 2: Launch the Backend

1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Start the FastAPI server (or simply run `run_backend.bat` on Windows):
   ```bash
   uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   The backend API will be available at `http://127.0.0.1:8000`.  
   Interactive API documentation (Swagger UI) is available at `http://127.0.0.1:8000/docs`.

---

### Step 3: Launch the Frontend

1. Navigate to the `frontend/` directory and install packages:
   ```bash
   cd frontend
   npm install
   ```

2. Start the development server (or run `run_frontend.bat` on Windows):
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173/`.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/documents/upload` | Uploads and indexes a `.pdf`, `.docx`, `.pptx`, or `.txt` file into FAISS. |
| `GET` | `/api/documents` | Lists all indexed documents, chunk counts, and global corpus statistics. |
| `POST` | `/api/qa` | Submits a question with optional conversation history, returning a grounded answer and citations. |
| `POST` | `/api/search` | Performs dense semantic search returning top-k passages ranked by similarity. |
| `GET` | `/api/chunks/{document_id}` | Retrieves all extracted text passages and metadata for a specific document. |
| `DELETE`| `/api/index/clear` | Clears all documents and resets the in-memory/on-disk FAISS index. |
| `GET` | `/api/health` | Health check endpoint confirming vector store and embedding engine readiness. |

---

## 🔬 Core Technologies & Models

* **Embedding Model**: `sentence-transformers/all-mpnet-base-v2`  
  * 768-dimensional dense representations.
  * State-of-the-art sentence transformer tuned for semantic similarity and semantic retrieval tasks.
* **Vector Index**: FAISS (`IndexFlatIP`)  
  * Exact inner product search on L2-normalized vectors (equivalent to cosine similarity).
* **Generation Engine**: Google Gemini (`gemini-2.5-flash` / `gemini-3.8-flash`)  
  * Strict system grounding prompts prohibiting speculative extrapolation.
* **Frontend**: React 18, TypeScript, Tailwind CSS v4, Lucide Icons, Vite.

---

## 🛡️ License

This project is developed for educational and academic research purposes under the **MIT License**.
