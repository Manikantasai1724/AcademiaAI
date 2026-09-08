# NLP & Information Retrieval Methodology

## 1. Dense vs. Sparse Retrieval
In this project, we utilize **Dense Semantic Retrieval** exclusively.
- **Sparse Retrieval (TF-IDF / BM25)**: Relies on exact term frequency and inverse document frequency. Vulnerable to lexical mismatch (e.g. asking for "neural network training" when text uses "backpropagation optimization").
- **Dense Retrieval (Sentence Transformers)**: Encodes contextual semantics into continuous geometry. Synonyms and semantically related phrasing map to high cosine similarity in latent space.

## 2. Chunking Strategy
Chunks represent the atomic unit of retrieval:
- **Chunk Size ($L$)**: Set to balance specificity and context (default: ~500 characters / ~100 words). Too large dilutes vector specificity; too small loses paragraph coherence.
- **Chunk Overlap ($O$)**: Set to ~10% (default: 50 characters) to prevent semantic fractures across sentence and concept boundaries.
- **Metadata Association**: Every chunk retains its document origin and page number to guarantee non-hallucinatory citations.
