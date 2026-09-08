"""Automated Information Retrieval Evaluation Runner.

Benchmarks dense semantic search on academic questions against ground-truth corpus.
Computes empirical Precision@K, Recall@K, Hit Rate@K, and MRR.
"""

import json
from pathlib import Path
from typing import Any, Dict, List
import numpy as np

from backend.app.documents import DocumentIngestionService
from backend.app.embeddings import EmbeddingManager
from backend.app.evaluation.build_corpus import generate_benchmark_corpus
from backend.app.evaluation.metrics import (
    hit_rate_at_k,
    precision_at_k,
    recall_at_k,
    reciprocal_rank,
)
from backend.app.nlp.chunker import IntelligentChunker
from backend.app.nlp.models import DocumentChunk
from backend.app.retrieval import FAISSVectorStore


class RetrievalEvaluator:
    """Automated benchmark runner for semantic vector search evaluation."""

    def __init__(
        self,
        corpus_dir: Path = Path("evaluation/datasets/corpus"),
        benchmark_file: Path = Path("evaluation/datasets/academic_benchmarks.json"),
        results_dir: Path = Path("evaluation/results"),
    ):
        self.corpus_dir = corpus_dir
        self.benchmark_file = benchmark_file
        self.results_dir = results_dir
        self.embedding_mgr = EmbeddingManager.get_instance()
        self.chunker = IntelligentChunker(chunk_size=500, chunk_overlap=50)
        self.vector_store = FAISSVectorStore(dimension=self.embedding_mgr.dimension)

    def prepare_corpus(self) -> int:
        """Ensure benchmark corpus exists and index all documents into FAISS."""
        generate_benchmark_corpus(self.corpus_dir)
        self.vector_store.clear()

        all_chunks: List[DocumentChunk] = []
        for file_path in self.corpus_dir.iterdir():
            if file_path.suffix.lower() in [".pdf", ".docx", ".pptx", ".txt"]:
                doc = DocumentIngestionService.extract_document(file_path)
                chunks = self.chunker.chunk_document(doc)
                all_chunks.extend(chunks)

        embeddings = self.embedding_mgr.encode_texts([c.text for c in all_chunks])
        self.vector_store.add_chunks(all_chunks, embeddings)
        return len(all_chunks)

    def run_evaluation(self, k_values: List[int] = [1, 3, 5]) -> Dict[str, Any]:
        """Execute all queries in the benchmark and compute IR metrics."""
        self.prepare_corpus()

        with open(self.benchmark_file, "r", encoding="utf-8") as f:
            benchmarks = json.load(f)

        query_evals: List[Dict[str, Any]] = []

        metrics_sum: Dict[str, float] = {f"precision@{k}": 0.0 for k in k_values}
        metrics_sum.update({f"recall@{k}": 0.0 for k in k_values})
        metrics_sum.update({f"hit_rate@{k}": 0.0 for k in k_values})
        metrics_sum["mrr"] = 0.0

        for bench in benchmarks:
            qid = bench["id"]
            q_type = bench["type"]
            query = bench["question"]
            target_doc = bench["target_doc"]
            target_page = bench.get("target_page")

            # Identify ground-truth relevant chunk IDs in indexed store
            relevant_chunk_ids = set()
            for chunk in self.vector_store.chunks_metadata:
                doc_match = chunk.filename.lower() == target_doc.lower()
                page_match = target_page is None or chunk.page_number == target_page
                if doc_match and page_match:
                    relevant_chunk_ids.add(chunk.chunk_id)

            # Perform semantic search
            q_vec = self.embedding_mgr.encode_text(query)
            max_k = max(k_values)
            search_results = self.vector_store.search(q_vec, top_k=max_k, threshold=0.0)
            retrieved_chunk_ids = [res.chunk.chunk_id for res in search_results]

            # Compute metrics for this query
            q_metrics: Dict[str, float] = {}
            for k in k_values:
                p_k = precision_at_k(retrieved_chunk_ids, relevant_chunk_ids, k)
                r_k = recall_at_k(retrieved_chunk_ids, relevant_chunk_ids, k)
                h_k = hit_rate_at_k(retrieved_chunk_ids, relevant_chunk_ids, k)

                q_metrics[f"precision@{k}"] = p_k
                q_metrics[f"recall@{k}"] = r_k
                q_metrics[f"hit_rate@{k}"] = h_k

                metrics_sum[f"precision@{k}"] += p_k
                metrics_sum[f"recall@{k}"] += r_k
                metrics_sum[f"hit_rate@{k}"] += h_k

            rr = reciprocal_rank(retrieved_chunk_ids, relevant_chunk_ids)
            q_metrics["mrr"] = rr
            metrics_sum["mrr"] += rr

            query_evals.append({
                "id": qid,
                "type": q_type,
                "question": query,
                "target_doc": target_doc,
                "retrieved_ranks": [
                    {
                        "rank": r.rank,
                        "chunk_id": r.chunk.chunk_id,
                        "filename": r.chunk.filename,
                        "page": r.chunk.page_number,
                        "score": r.score,
                        "is_relevant": r.chunk.chunk_id in relevant_chunk_ids,
                    }
                    for r in search_results
                ],
                "metrics": q_metrics,
            })

        num_queries = len(benchmarks)
        mean_metrics = {k: round(v / num_queries, 4) for k, v in metrics_sum.items()}

        final_report = {
            "total_queries": num_queries,
            "total_corpus_chunks": self.vector_store.total_chunks,
            "mean_metrics": mean_metrics,
            "detailed_queries": query_evals,
        }

        # Save results to disk
        self.results_dir.mkdir(parents=True, exist_ok=True)
        results_file = self.results_dir / "retrieval_metrics.json"
        with open(results_file, "w", encoding="utf-8") as f:
            json.dump(final_report, f, indent=2)

        return final_report


def print_metrics_table(report: Dict[str, Any]) -> None:
    """Format and print an academic evaluation summary table."""
    mean_metrics = report["mean_metrics"]
    print("\n" + "=" * 45)
    print("  ACADEMIC SEMANTIC RETRIEVAL EVALUATION")
    print("=" * 45)
    print(f"{'Metric':<20} | {'Measured Score':<15}")
    print("-" * 45)
    for metric_name, val in mean_metrics.items():
        print(f"{metric_name.upper():<20} | {val:<15.4f}")
    print("=" * 45 + "\n")


if __name__ == "__main__":
    evaluator = RetrievalEvaluator()
    report = evaluator.run_evaluation()
    print_metrics_table(report)
