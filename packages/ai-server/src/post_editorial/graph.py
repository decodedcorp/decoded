"""Post editorial LangGraph pipeline."""

from __future__ import annotations

import logging

from langgraph.graph import END, START, StateGraph

from .state import PostEditorialState
from .nodes.design_spec import design_spec_node
from .nodes.image_analysis import image_analysis_node
from .nodes.item_research import item_research_node
from .nodes.summary import summary_node
from .nodes.editorial import editorial_node
from .nodes.celeb_search import celeb_search_node
from .nodes.item_search import item_search_node
from .nodes.review import review_node
from .nodes.publish import publish_node

logger = logging.getLogger(__name__)


def route_after_review(state: PostEditorialState) -> str:
    review_result = state.get("review_result") or {}
    if review_result.get("passed"):
        return "Publish"
    revision_count = state.get("revision_count", 0)
    if revision_count >= 3:
        return END
    return "Editorial"


def create_post_editorial_graph(checkpointer=None):
    """Build and compile the post editorial StateGraph."""
    builder = StateGraph(PostEditorialState)

    builder.add_node("DesignSpec", design_spec_node)
    builder.add_node("ImageAnalysis", image_analysis_node)
    builder.add_node("ItemResearch", item_research_node)
    builder.add_node("Summary", summary_node)
    builder.add_node("Editorial", editorial_node)
    builder.add_node("CelebSearch", celeb_search_node)
    builder.add_node("ItemSearch", item_search_node)
    builder.add_node("Review", review_node)
    builder.add_node("Publish", publish_node)

    builder.add_edge(START, "DesignSpec")
    builder.add_edge(START, "ImageAnalysis")
    builder.add_edge(START, "ItemResearch")
    builder.add_edge("DesignSpec", "Editorial")
    builder.add_edge("ImageAnalysis", "Editorial")
    builder.add_edge("ItemResearch", "Editorial")

    builder.add_edge("Editorial", "CelebSearch")
    builder.add_edge("Editorial", "ItemSearch")
    builder.add_edge("Editorial", "Summary")

    builder.add_edge("CelebSearch", "Review")
    builder.add_edge("ItemSearch", "Review")
    builder.add_edge("Summary", "Review")

    builder.add_conditional_edges("Review", route_after_review, {"Publish": "Publish", "Editorial": "Editorial", END: END})
    builder.add_edge("Publish", END)

    return builder.compile(checkpointer=checkpointer)
