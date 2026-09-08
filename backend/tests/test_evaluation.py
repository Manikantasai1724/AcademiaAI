"""Unit tests for Phase 11: Information Retrieval Evaluation Metrics."""

import pytest
from backend.app.evaluation.metrics import (
    hit_rate_at_k,
    precision_at_k,
    recall_at_k,
    reciprocal_rank,
)
from backend.app.evaluation.runner import RetrievalEvaluator


def test_metric_functions():
    """Verify precision@k, recall@k, hit_rate@k, and MRR calculations."""
    retrieved = ["doc_A", "doc_B", "doc_C", "doc_D", "doc_E"]
    relevant = {"doc_B", "doc_D"}

    # Precision@1: "doc_A" is not relevant -> 0/1 = 0.0
    assert precision_at_k(retrieved, relevant, k=1) == 0.0

    # Precision@2: "doc_A" (no), "doc_B" (yes) -> 1/2 = 0.5
    assert precision_at_k(retrieved, relevant, k=2) == 0.5

    # Recall@2: 1 relevant retrieved out of 2 total relevant -> 1/2 = 0.5
    assert recall_at_k(retrieved, relevant, k=2) == 0.5

    # HitRate@1: 0.0, HitRate@2: 1.0
    assert hit_rate_at_k(retrieved, relevant, k=1) == 0.0
    assert hit_rate_at_k(retrieved, relevant, k=2) == 1.0

    # Reciprocal Rank: First relevant item is at rank 2 -> 1/2 = 0.5
    assert reciprocal_rank(retrieved, relevant) == 0.5


def test_retrieval_evaluator_end_to_end(tmp_path):
    """Verify that RetrievalEvaluator runs over benchmarks and produces metrics report."""
    evaluator = RetrievalEvaluator(
        corpus_dir=tmp_path / "corpus",
        results_dir=tmp_path / "results",
    )
    report = evaluator.run_evaluation(k_values=[1, 3, 5])

    assert report["total_queries"] == 6
    assert report["total_corpus_chunks"] > 0
    assert "mean_metrics" in report
    metrics = report["mean_metrics"]

    assert "precision@1" in metrics
    assert "recall@5" in metrics
    assert "hit_rate@3" in metrics
    assert "mrr" in metrics
    assert metrics["mrr"] > 0.5  # Semantic search should perform strongly on curated benchmark
