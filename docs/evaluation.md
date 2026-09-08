# Empirical Information Retrieval Evaluation Results

## 1. Experimental Methodology

The dense semantic search retrieval system was benchmarked against a curated academic evaluation dataset spanning six distinct question categories:
1. **Definition**: Concept definition queries (e.g. *What is backpropagation in deep learning?*)
2. **Factual**: Direct historical/fact attribution (e.g. *Who introduced the Transformer architecture in 2017?*)
3. **Explanation**: Mechanistic and mathematical rationale (e.g. *Why does self-attention scale dot products by sqrt(d_k)?*)
4. **Comparison**: Contrasting paradigms (e.g. *How does dense semantic retrieval differ from sparse search?*)
5. **Process**: Algorithmic workflows (e.g. *What are the computational steps in Stochastic Gradient Descent?*)
6. **Conceptual**: Mathematical equivalences (e.g. *Why is cosine similarity equivalent to dot products for normalized vectors?*)

The benchmark corpus comprised multi-page academic literature across **PDF**, **DOCX**, **PPTX**, and **TXT** formats indexed in **FAISS IndexFlatIP** using `sentence-transformers/all-mpnet-base-v2`.

---

## 2. Measured Evaluation Results

Evaluated on actual indexed benchmark corpus (`evaluation/results/retrieval_metrics.json`):

| Metric | Measured Score | Interpretation |
| :--- | :---: | :--- |
| **Precision@1** | **0.8333** (83.3%) | In 83.3% of queries, the #1 top-ranked chunk was directly relevant. |
| **Precision@3** | **0.3889** (38.9%) | Precision in top-3 candidate window. |
| **Precision@5** | **0.3000** (30.0%) | Precision in top-5 candidate window. |
| **Recall@1** | **0.5556** (55.6%) | Over half of all relevant chunks are captured in the top rank alone. |
| **Recall@3** | **0.6944** (69.4%) | Nearly 70% of relevant chunks are retrieved in the top-3 window. |
| **Recall@5** | **0.8333** (83.3%) | 83.3% of all relevant passages retrieved in the top-5 window. |
| **Hit Rate@1** | **0.8333** (83.3%) | In 5 out of 6 queries, the first retrieved result hit a relevant chunk. |
| **Hit Rate@3** | **0.8333** (83.3%) | At least one relevant chunk present in top-3 candidates. |
| **Hit Rate@5** | **0.8333** (83.3%) | At least one relevant chunk present in top-5 candidates. |
| **MRR (Mean Reciprocal Rank)** | **0.8333** | The average rank of the first relevant chunk is $1.2$ ($1/0.8333$). |

---

## 3. Query-by-Query Diagnostic Breakdown

| Query ID | Category | Question Text | Top Retrieved Chunk | Cosine Score | Relevant? | Rank |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: |
| **Q01** | Definition | *What is backpropagation in deep learning?* | `deep_learning.pdf` (p. 1) | `0.8175` | Yes | 1 |
| **Q02** | Factual | *Who introduced the Transformer in 2017?* | `transformer_nlp.docx` (p. 1) | `0.4585` | Yes | 1 |
| **Q03** | Explanation | *Why does self-attention scale dot products by sqrt(d_k)?* | `transformer_nlp.docx` (p. 1) | `0.7054` | Sectional | 1 |
| **Q04** | Comparison | *Dense semantic retrieval vs sparse keyword search?* | `information_retrieval.pptx` (p. 1) | `0.7416` | Yes | 1 |
| **Q05** | Process | *Steps involved in SGD weight updates?* | `loss_optimization.txt` (p. 1) | `0.7879` | Yes | 1 |
| **Q06** | Conceptual | *Why cosine similarity equals dot product for L2 vectors?* | `information_retrieval.pptx` (p. 2) | `0.7484` | Yes | 1 |

---

## 4. Qualitative RAG Answer & Grounding Analysis

### Successful Grounding Case
* **Question**: *"What is backpropagation in deep learning?"*
* **Retrieved Chunk**: `deep_learning.pdf` (Page 1) with score `0.8175`.
* **Grounded Answer**: Accurately explains gradient computation through reverse accumulation and chain rule.
* **Citations**: Non-hallucinated citation pointing to `deep_learning.pdf`, Page 1, Section: *Backpropagation in Deep Neural Networks*.

### Low-Confidence Rejection Case
* **Question**: *"What is the capital of France and what pastries are famous?"*
* **Retrieval Outcome**: Query vector similarity against all academic chunks yielded max score `0.184`, falling strictly below $\tau = 0.35$.
* **System Action**: Triggered low-confidence refusal:
  > *"I couldn't find sufficient information about this question in the provided academic materials."*
* **Hallucination Prevention**: Zero citations generated, preventing the LLM from synthesizing unsupported outside knowledge.
