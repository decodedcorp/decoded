"""OriginalImageSearcher: mocks the Cloud Vision client, verifies parsing."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from src.services.media.original_search.searcher import OriginalImageSearcher


def _mock_response(
    *,
    entities=(),
    full_matches=(),
    partial_matches=(),
    visually_similar=(),
    pages=(),
    error_msg: str = "",
):
    wd = SimpleNamespace(
        web_entities=[
            SimpleNamespace(description=d, score=s) for d, s in entities
        ],
        full_matching_images=[SimpleNamespace(url=u) for u in full_matches],
        partial_matching_images=[SimpleNamespace(url=u) for u in partial_matches],
        visually_similar_images=[SimpleNamespace(url=u) for u in visually_similar],
        pages_with_matching_images=[
            SimpleNamespace(url=u, page_title=t or "", score=0.0) for u, t in pages
        ],
    )
    return SimpleNamespace(web_detection=wd, error=SimpleNamespace(message=error_msg))


def test_search_returns_full_and_partial_matches_only():
    client = MagicMock()
    client.web_detection.return_value = _mock_response(
        entities=[("JENNIE", 12.3), ("TWICE", 0.6)],
        full_matches=["https://x.com/full1.jpg"],
        partial_matches=["https://x.com/p1.jpg", "https://x.com/p2.jpg"],
        visually_similar=[
            "https://noise.example.com/a.jpg",
            "https://noise.example.com/b.jpg",
        ],
    )
    searcher = OriginalImageSearcher(client=client)

    result = searcher.search(b"img-bytes")

    assert [e[0] for e in result.entities] == ["JENNIE", "TWICE"]
    urls = [c.url for c in result.candidates]
    sources = [c.source for c in result.candidates]
    assert urls == [
        "https://x.com/full1.jpg",
        "https://x.com/p1.jpg",
        "https://x.com/p2.jpg",
    ]
    assert sources == ["full_match", "partial_match", "partial_match"]
    # visually_similar must NOT be surfaced
    assert all("noise" not in u for u in urls)


def test_search_skips_empty_entity_descriptions():
    client = MagicMock()
    client.web_detection.return_value = _mock_response(
        entities=[("", 0.5), ("JENNIE", 10.0)],
    )
    searcher = OriginalImageSearcher(client=client)
    result = searcher.search(b"x")
    assert result.entities == [("JENNIE", 10.0)]


def test_search_raises_on_api_error():
    client = MagicMock()
    client.web_detection.return_value = _mock_response(error_msg="PERMISSION_DENIED")
    searcher = OriginalImageSearcher(client=client)
    with pytest.raises(RuntimeError, match="PERMISSION_DENIED"):
        searcher.search(b"x")


def test_search_handles_empty_response():
    client = MagicMock()
    client.web_detection.return_value = _mock_response()
    searcher = OriginalImageSearcher(client=client)
    result = searcher.search(b"x")
    assert result.entities == []
    assert result.candidates == []
