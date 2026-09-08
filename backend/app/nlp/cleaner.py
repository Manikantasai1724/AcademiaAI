"""Text cleaning and normalization utilities.

Applies conservative, high-fidelity text normalization designed specifically
for modern transformer embeddings (avoiding destructive stem/stopword removal).
"""

import re


class TextCleaner:
    """Provides gentle text normalization preserving linguistic integrity for embeddings."""

    # Reconnect hyphenated line wraps: "struc-\n ture" -> "structure"
    HYPHENATION_PATTERN = re.compile(r"(\b\w+)-\s*\n\s*(\w+\b)")

    # Multiple newlines (>2) collapsed to double newline (paragraph boundary)
    MULTI_NEWLINE_PATTERN = re.compile(r"\n{3,}")

    # Multiple whitespace within lines collapsed to single space
    MULTI_SPACE_PATTERN = re.compile(r"[^\S\r\n]+")

    # Strip non-printable control characters except standard whitespace
    CONTROL_CHAR_PATTERN = re.compile(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]")

    @classmethod
    def clean(cls, text: str) -> str:
        """Clean raw extracted text while preserving natural grammatical structure."""
        if not text:
            return ""

        # Remove control characters
        text = cls.CONTROL_CHAR_PATTERN.sub("", text)

        # Standardize carriage returns to standard newline
        text = text.replace("\r\n", "\n").replace("\r", "\n")

        # Fix hyphenated words split across lines in academic PDFs
        text = cls.HYPHENATION_PATTERN.sub(r"\1\2", text)

        # Collapse excess intra-line spaces
        text = cls.MULTI_SPACE_PATTERN.sub(" ", text)

        # Collapse excessive newlines to preserve clean paragraph breaks
        text = cls.MULTI_NEWLINE_PATTERN.sub("\n\n", text)

        # Strip outer whitespace
        return text.strip()
