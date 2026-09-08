# System Architecture & Technical Specifications

## 1. High-Level Architecture Overview

The system is designed as an academic-grade Natural Language Processing (NLP) pipeline for Question Answering and Information Retrieval over multi-format scholarly literature (PDF, DOCX, PPTX, TXT).

```
+-------------------------------------------------------------------------------+
|                                INGESTION LAYER                                |
|  [PDF / DOCX / PPTX / TXT] ---> Document Ingestion ---> Page-level Extraction |
+-------------------------------------------------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                               PREPROCESSING & CHUNKING                        |
|  Whitespace Normalization ---> Paragraph Detection ---> Semantic Chunking     |
|                               (Metadata Preservation: page, section, doc_id)  |
+-------------------------------------------------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                            EMBEDDINGS & VECTOR STORE                          |
|  Dense Bi-Encoder (all-mpnet-base-v2) ---> 768-d Vectors ---> FAISS Index     |
|                                                          ---> Metadata JSON   |
+-------------------------------------------------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                             RETRIEVAL & SIMILARITY                            |
|  User Query ---> Bi-Encoder Query Vector ---> FAISS Dot Product Search        |
|             ---> Top-K Chunks Filtered by Cosine Similarity Threshold         |
+-------------------------------------------------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                          RAG GENERATION & CITATIONS                           |
|  Strict Academic Grounding Prompt + Chunks + Conversation History ---> Gemini |
|  Synthesized Answer + Exact Metadata Citations (Document, Page, Chunk)        |
+-------------------------------------------------------------------------------+
```

## 2. Mathematical Formalization of Retrieval

Let $\mathcal{D} = \{c_1, c_2, \dots, c_N\}$ denote the set of all extracted chunks across indexed documents, where each chunk $c_i$ is accompanied by metadata:
$$m(c_i) = \langle \text{doc\_id}, \text{filename}, \text{page\_num}, \text{section}, \text{chunk\_id} \rangle$$

### 2.1 Embedding Transformation
Each text chunk $c_i$ is mapped into a dense representation via the Sentence Transformer embedding function $f_\theta: \mathcal{T} \to \mathbb{R}^d$:
$$\mathbf{v}_i = \frac{f_\theta(c_i)}{\|f_\theta(c_i)\|_2}$$
Where $d = 768$ for `sentence-transformers/all-mpnet-base-v2`. Vectors are $L_2$-normalized such that Euclidean inner product directly equals cosine similarity:
$$\cos(\mathbf{q}, \mathbf{v}_i) = \mathbf{q} \cdot \mathbf{v}_i$$

### 2.2 Nearest Neighbor Retrieval (FAISS)
Given user query text $q$, the query vector is generated:
$$\mathbf{q} = \frac{f_\theta(q)}{\|f_\theta(q)\|_2}$$
FAISS computes the top-$K$ indices $\mathcal{I}_K$ that maximize similarity:
$$\mathcal{I}_K = \operatorname{arg\,top-}K_{i \in \{1,\dots,N\}} (\mathbf{q} \cdot \mathbf{v}_i)$$

### 2.3 Confidence Threshold Filtering
To prevent hallucinations on out-of-domain or unanswerable queries, retrieved candidates are filtered against a similarity threshold $\tau$:
$$\mathcal{R}_K = \{ c_i \mid i \in \mathcal{I}_K \land (\mathbf{q} \cdot \mathbf{v}_i) \ge \tau \}$$
If $\mathcal{R}_K = \emptyset$, the system rejects generation and gracefully yields:
> *"I couldn't find sufficient information about this question in the provided academic materials."*

## 3. Grounded Generation Contract
When $\mathcal{R}_K \neq \emptyset$, the context string $\mathcal{C}$ is synthesized:
$$\mathcal{C} = \bigoplus_{c_i \in \mathcal{R}_K} \Big[ \text{Source: } m(c_i).\text{filename} \mid \text{Page: } m(c_i).\text{page\_num} \mid \text{Passage: } c_i \Big]$$
The Gemini model acts purely as a reasoning agent conditioned on $\mathcal{C}$ and question $q$.
