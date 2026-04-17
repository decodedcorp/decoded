import logging
import time
from typing import Dict
from urllib.parse import urlparse

from src.database.models.content import (
    LinkPreviewMetadata,
    ProcessedLinkMetadata,
    LinkProcessingResult,
    ProcessingStatus,
)
from src.managers.llm.base import BaseLLMClient
from src.managers.llm.base.message import LLMMessage, LLMResponse
from src.managers.llm.base.types import ContentType
from .schemas import ProductResponse, ArticleResponse, VideoResponse, OtherResponse
from .link_type_classifier import LinkTypeClassifier


def parse_hostname(url: str) -> str:
    """
    Parse hostname from URL
    """
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname.lower() if parsed.hostname else ""
        return hostname.replace("www.", "")
    except Exception:
        return ""


class LinkAIAnalyzer:
    """Analyzer for Link Metadata using AI (via BaseLLMClient)"""

    def __init__(
        self,
        llm_client: BaseLLMClient,
        link_type_classifier: LinkTypeClassifier,
        environment=None,
    ):
        self.llm_client = llm_client
        self.link_type_classifier = link_type_classifier
        self.environment = environment
        self.logger = logging.getLogger(__name__)

        # Check if client is available
        if not self.llm_client:
            self.logger.warning("LLM client not provided for LinkAIAnalyzer")
        if not self.link_type_classifier:
            self.logger.warning("LinkTypeClassifier not provided for LinkAIAnalyzer")

    async def analyze(
        self, url: str, item_id: str, og_metadata: Dict[str, str]
    ) -> LinkProcessingResult:
        """
        Analyze link using LLM
        """
        start_time = time.time()
        try:
            # Check if LLM client is available
            if not self.llm_client:
                raise ValueError("LLM client not initialized")

            # Create LinkPreviewMetadata from provided OG data
            link_preview = LinkPreviewMetadata(
                title=og_metadata.get("title") or "",
                description=og_metadata.get("description") or "",
                site_name=og_metadata.get("site_name") or "",
                img_url=None,  # Image not needed for text analysis
            )

            # Extract host for prompt
            host = parse_hostname(url)

            # Step 1: Classify link type using Groq (fast inference)
            link_type = await self.link_type_classifier.classify(
                url=url, title=link_preview.title, description=link_preview.description
            )

            # Step 2: Select appropriate single schema based on link_type
            schema_map = {
                "product": ProductResponse,
                "article": ArticleResponse,
                "video": VideoResponse,
                "other": OtherResponse,
            }
            response_schema = schema_map.get(link_type, OtherResponse)

            # Step 3: Extract metadata with selected single schema (not Union)
            response = await self._extract_with_llm(link_preview, host, response_schema)

            structured_output = response.structured_output
            if structured_output is None:
                return LinkProcessingResult(
                    item_id=item_id,
                    url=url,
                    status=ProcessingStatus.PARTIAL,
                    error_message="Failed to extract metadata",
                    processing_time=time.time() - start_time,
                )

            # Create result metadata
            processed_metadata = ProcessedLinkMetadata(
                link_type=structured_output.get("link_type", "other"),
                summary=structured_output.get("summary", ""),
                qa_pairs=structured_output.get("qna", []),
                keywords=structured_output.get("keywords", []),
                metadata=structured_output.get("metadata", {}),
            )

            processing_time = time.time() - start_time
            self.logger.info(f"Successfully analyzed link {item_id} in {processing_time:.2f}s")

            return LinkProcessingResult(
                item_id=item_id,
                url=url,
                status=ProcessingStatus.SUCCESS,
                metadata=processed_metadata,
                post_id=None,  # Will be set by caller if needed
                processing_time=processing_time,
            )

        except Exception as e:
            processing_time = time.time() - start_time
            error_message = f"Error analyzing link {item_id}: {str(e)}"
            self.logger.error(error_message, exc_info=True)

            return LinkProcessingResult(
                item_id=item_id,
                url=url,
                status=ProcessingStatus.FAILED,
                error_message=error_message,
                processing_time=processing_time,
            )

    async def _extract_with_llm(
        self, link_preview: LinkPreviewMetadata, host: str, response_schema: type
    ) -> LLMResponse:
        """
        Extract metadata using LLM client with specified schema

        Args:
            url: URL being analyzed
            link_preview: Link metadata
            host: Hostname
            response_schema: Single Pydantic schema (ProductResponse, ArticleResponse, etc.)
        """
        try:
            messages = []

            if link_preview.title:
                messages.append(LLMMessage(role="user", content=f"Title: {link_preview.title}"))
            if link_preview.description:
                messages.append(
                    LLMMessage(role="user", content=f"Description: {link_preview.description}")
                )
            messages.append(LLMMessage(role="user", content=f"Platform: {host}"))
            messages.append(
                LLMMessage(
                    role="user",
                    content=(
                        "Summarize the content of this link in 1-2 sentences "
                        "and put it in the summary field (English)."
                    ),
                )
            )
            messages.append(
                LLMMessage(
                    role="user",
                    content="Also include 3-5 question-and-answer pairs about this link in the qna field (English).",
                )
            )
            messages.append(LLMMessage(role="user", content="Extract keywords in English only."))
            messages.append(
                LLMMessage(
                    role="user",
                    content="Important: every value in the metadata field must be written in English.",
                )
            )

            self.logger.debug(f"Messages count: {len(messages)}")
            for i, msg in enumerate(messages):
                self.logger.debug(f"Message {i + 1}: {msg.content}")

            return await self.llm_client.completion(
                messages=messages,
                content_type=ContentType.TEXT,
                response_schema=response_schema,
            )

        except Exception as e:
            self.logger.error(f"Error enhancing with LLM: {str(e)}")
            raise
