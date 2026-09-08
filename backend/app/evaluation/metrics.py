"""Information Retrieval Evaluation Metrics.

Implements standard IR ranking and relevance metrics:
Precision@K, Recall@K, Hit Rate@K, and Mean Reciprocal Rank (MRR).
"""

from typing import List, Set


def precision_at_k(retrieved_ids: List[str], relevant_ids: Set[str], k: int) -> float:
    """Compute Precision@K: fraction of top-K retrieved items that are relevant."""
    if k <= 0:
        return 0.0
    top_k = retrieved_ids[:k]
    if not top_k:
        return 0.0
    relevant_retrieved = sum(1 for item_id in top_k if item_id in relevant_ids)
    return relevant_retrieved / k


def recall_at_k(retrieved_ids: List[str], relevant_ids: Set[str], k: int) -> float:
    """Compute Recall@K: fraction of total relevant items retrieved within top-K."""
    if not relevant_ids:
        return 0.0
    top_k = retrieved_ids[:k]
    relevant_retrieved = sum(1 for item_id in top_k if item_id in relevant_ids)
    return relevant_retrieved / len(relevant_ids)


def hit_rate_at_k(retrieved_ids: List[str], relevant_ids: Set[str], k: int) -> float:
    """Compute Hit Rate@K (Success@K): 1.0 if at least one relevant item is in top-K, else 0.0."""
    top_k = retrieved_ids[:k]
    for item_id in top_k:
        if item_id in relevant_ids:
            return 1.0
    return 0.0


def reciprocal_rank(retrieved_ids: List[str], relevant_ids: Set[str]) -> float:
    """Compute Reciprocal Rank (RR): 1 / rank of the first relevant retrieved item."""
    for rank_idx, item_id in enumerate(retrieved_ids, start=1):
        if item_id in relevant_ids:
            return 1.0 / rank_idx
    return 0.0
