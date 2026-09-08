"""Prompt engineering and context construction for grounded academic RAG."""

from typing import List
from backend.app.rag.models import ConversationMessage
from backend.app.retrieval.models import SearchResult

ACADEMIC_SYSTEM_PROMPT = """You are an academic assistant.

Answer the question using ONLY the supplied academic context below.
Do not invent information.
Do not use unsupported external knowledge.

If the supplied context does not contain enough information to answer, say:
"I couldn't find sufficient information in the provided academic materials."

Give a clear, rigorous, and educational answer.
Refer to sources using the supplied source numbers (e.g. [Source 1], [Source 2]).
"""


def build_rag_prompt(
    question: str,
    retrieved_results: List[SearchResult],
    conversation_history: List[ConversationMessage] = None,
) -> str:
    """Construct the final prompt containing retrieved context, history, and question."""
    context_blocks: List[str] = []

    for idx, res in enumerate(retrieved_results, start=1):
        chunk = res.chunk
        section_info = f" | Section: {chunk.section}" if chunk.section else ""
        header = f"--- [Source {idx}] Document: '{chunk.filename}' | Page/Slide: {chunk.page_number}{section_info} ---"
        context_blocks.append(f"{header}\n{chunk.text.strip()}\n")

    context_str = "\n".join(context_blocks)

    # Format recent conversational context (sliding window of max 3 turns)
    history_str = ""
    if conversation_history:
        recent_history = conversation_history[-3:]
        history_lines = [
            f"{msg.role.capitalize()}: {msg.content.strip()}"
            for msg in recent_history
            if msg.content.strip()
        ]
        if history_lines:
            history_str = "Recent Conversation History:\n" + "\n".join(history_lines) + "\n\n"

    final_prompt = (
        f"{ACADEMIC_SYSTEM_PROMPT}\n\n"
        f"SUPPLIED ACADEMIC CONTEXT:\n"
        f"{context_str}\n\n"
        f"{history_str}"
        f"STUDENT QUESTION:\n{question}\n\n"
        f"GROUNDED ANSWER:"
    )

    return final_prompt
