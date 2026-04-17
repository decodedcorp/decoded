import time
import base64
import tempfile
import os
import gc
import psutil
from typing import Dict, Any, Optional
import logging
from src.database.models.content import (
    ProcessedImageMetadata,
    ImageProcessingResult,
    ProcessingStatus,
)
from src.services.metadata.clients.web_scraper import WebScraperService
from src.managers.llm.base import BaseLLMClient, LLMMessage
from src.managers.llm.base.types import ContentType
from src.services.metadata.utils.image_compression import ImageCompressor


class ImageProcessor:
    """Processing pipeline for image data analysis"""

    def __init__(self, web_scraper: WebScraperService, llm_client: BaseLLMClient):
        self.web_scraper = web_scraper
        self.llm_client = llm_client
        self.image_compressor = ImageCompressor()
        self.logger = logging.getLogger(__name__)

    def _log_memory_usage(self, context: str) -> None:
        """Log current memory usage for monitoring"""
        try:
            process = psutil.Process()
            memory_info = process.memory_info()
            memory_mb = memory_info.rss / 1024 / 1024
            self.logger.info(f"Memory usage [{context}]: {memory_mb:.2f} MB")
        except Exception as e:
            self.logger.debug(f"Failed to get memory info: {e}")

    def _build_category_rules_string(self, category_rules: Dict[str, list]) -> str:
        """Build category rules string for prompt"""
        rules_lines = []
        for category, sub_categories in category_rules.items():
            sub_cat_str = ", ".join(sub_categories)
            rules_lines.append(f"- {category}: {sub_cat_str}")
        return "\n".join(rules_lines)

    async def process_image(self, image_url: str, item_id: str) -> ImageProcessingResult:
        """
        Process a single image through the analysis pipeline

        Args:
            image_url: URL of the image to process
            item_id: Unique identifier for this item

        Returns:
            ImageProcessingResult with analyzed metadata
        """
        start_time = time.time()

        # Log initial memory usage
        self._log_memory_usage("start")

        # Variables for memory cleanup
        image_data = None
        compressed_image_data = None
        base64_data = None

        try:
            # Phase 1: Download image data
            image_data = await self.web_scraper.download_image(image_url)
            if not image_data:
                return ImageProcessingResult(
                    item_id=item_id,
                    url=image_url,
                    status=ProcessingStatus.FAILED,
                    error_message="Failed to download image",
                )

            self.logger.info(f"Downloaded image: {len(image_data)} bytes")
            self._log_memory_usage("after download")

            # Phase 2: Compress image if needed
            compressed_image_data = self.image_compressor.compress_if_needed(image_data)
            self.logger.info(f"Image size after compression: {len(compressed_image_data)} bytes")
            self._log_memory_usage("after compression")

            # Free original image data from memory
            del image_data
            image_data = None

            # Phase 3: Convert to base64 for API analysis
            base64_data = base64.b64encode(compressed_image_data).decode("utf-8")

            # Free compressed image data from memory
            del compressed_image_data
            compressed_image_data = None

            # Phase 4: LLM Analysis using image data
            messages = [
                LLMMessage(role="user", content="Analyze this image and provide detailed metadata")
            ]
            llm_response = await self.llm_client.completion(
                messages=messages, content_type=ContentType.IMAGE, image_data=base64_data
            )
            # Convert LLMResponse to expected format for compatibility
            analysis_result = (
                llm_response.structured_output if llm_response.structured_output else {}
            )

            # Free base64 data from memory
            del base64_data
            base64_data = None

            # Phase 5: Create ProcessedImageMetadata
            processed_image_metadata = self._create_processed_image_metadata(analysis_result)

            # Phase 6: Determine processing status
            status = self._determine_processing_status(processed_image_metadata)

            processing_time = time.time() - start_time
            self.logger.info(
                f"Successfully processed image {item_id} in {processing_time:.2f}s: status={status}"
            )

            return ImageProcessingResult(
                item_id=item_id, url=image_url, status=status, metadata=processed_image_metadata
            )

        except Exception as e:
            processing_time = time.time() - start_time
            error_message = f"Error processing image {item_id}: {str(e)}"
            self.logger.error(error_message)

            return ImageProcessingResult(
                item_id=item_id,
                url=image_url,
                status=ProcessingStatus.FAILED,
                error_message=error_message,
            )
        finally:
            # Explicit memory cleanup
            if image_data is not None:
                del image_data
            if compressed_image_data is not None:
                del compressed_image_data
            if base64_data is not None:
                del base64_data

            # Force garbage collection for large objects
            gc.collect()
            self._log_memory_usage("cleanup complete")

    async def process_image_data(
        self, image_data: bytes, item_id: str, category_rules: Optional[Dict[str, list]] = None
    ) -> ImageProcessingResult:
        """
        Process binary image data through the analysis pipeline

        Args:
            image_data: Binary image data
            item_id: Unique identifier for this item
            category_rules: Optional category rules for image analysis

        Returns:
            ImageProcessingResult with analyzed metadata
        """
        start_time = time.time()
        self.logger.info(f"Processing binary image data {item_id}: {len(image_data)} bytes")

        # Log initial memory usage
        self._log_memory_usage("binary start")

        # Variables for memory cleanup
        temp_file_path = None
        compressed_image_data = None
        base64_data = None
        data_uri = None

        try:
            # Phase 1: Save to temporary file
            temp_file_path = await self._save_image_to_temp_file(image_data, item_id)

            # Phase 2: Compress image if needed
            compressed_image_data = self.image_compressor.compress_if_needed(image_data)
            self.logger.info(
                f"Binary image size after compression: {len(compressed_image_data)} bytes"
            )

            # Phase 3: Convert to base64 for API analysis
            base64_data = base64.b64encode(compressed_image_data).decode("utf-8")
            data_uri = f"data:image/jpeg;base64,{base64_data}"

            # Free compressed image data from memory
            del compressed_image_data
            compressed_image_data = None

            # Phase 4: LLM Analysis
            # Build prompt with category rules if provided
            prompt = "Analyze this image and provide detailed metadata"
            if category_rules:
                category_rules_str = self._build_category_rules_string(category_rules)
                prompt = f"{prompt}\n\nCategory Rules:\n{category_rules_str}"

            messages = [LLMMessage(role="user", content=prompt)]
            llm_response = await self.llm_client.completion(
                messages=messages, content_type=ContentType.IMAGE, image_data=base64_data
            )
            # Convert LLMResponse to expected format for compatibility
            analysis_result = (
                llm_response.structured_output if llm_response.structured_output else {}
            )

            # Free base64 data from memory
            del base64_data
            base64_data = None

            # Phase 5: Create ProcessedImageMetadata
            processed_metadata = self._create_processed_image_metadata(analysis_result)

            # Phase 6: Determine processing status
            status = self._determine_processing_status(processed_metadata)

            processing_time = time.time() - start_time
            self.logger.info(
                f"Successfully processed binary image {item_id} in {processing_time:.2f}s: "
                f"status={status}"
            )

            return ImageProcessingResult(
                item_id=item_id, url=data_uri, status=status, metadata=processed_metadata
            )

        except Exception as e:
            processing_time = time.time() - start_time
            error_message = f"Error processing binary image {item_id}: {str(e)}"
            self.logger.error(error_message)

            return ImageProcessingResult(
                item_id=item_id,
                url=f"binary_image_{item_id}",
                status=ProcessingStatus.FAILED,
                error_message=error_message,
            )
        finally:
            # Explicit memory cleanup
            if compressed_image_data is not None:
                del compressed_image_data
            if base64_data is not None:
                del base64_data
            if data_uri is not None:
                del data_uri

            # Clean up temporary file
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                except Exception as e:
                    self.logger.warning(f"Failed to cleanup temp file {temp_file_path}: {e}")

            # Force garbage collection for large objects
            gc.collect()
            self._log_memory_usage("cleanup complete")

    async def _save_image_to_temp_file(self, image_data: bytes, item_id: str) -> str:
        """Save binary image data to a temporary file"""
        try:
            # Create temporary file
            with tempfile.NamedTemporaryFile(
                delete=False, suffix=".jpg", prefix=f"img_{item_id}_"
            ) as temp_file:
                temp_file.write(image_data)
                temp_file.flush()
                self.logger.info(f"Saved image data to temporary file: {temp_file.name}")
                return temp_file.name
        except Exception as e:
            self.logger.error(f"Failed to save image data to temp file: {e}")
            raise

    def _create_processed_image_metadata(
        self, analysis_result: Dict[str, Any]
    ) -> ProcessedImageMetadata:
        """
        Create ProcessedImageMetadata from analysis result

        Args:
            analysis_result: Result from Perplexity analysis

        Returns:
            ProcessedImageMetadata instance
        """
        try:
            # Extract description (standardized field names - no prefixes)
            description = analysis_result.get("description", "")
            objects = analysis_result.get("objects", [])
            context = analysis_result.get("context", "")
            style = analysis_result.get("style", "")
            category = analysis_result.get("category", "")
            qna = analysis_result.get("qna", [])
            metadata = analysis_result.get("metadata", {})

            return ProcessedImageMetadata(
                description=description or None,
                objects=objects or None,
                context=context or None,
                style=style or None,
                metadata=metadata,
                category=category or None,
                qna=qna or None,
            )

        except Exception as e:
            self.logger.error(f"Failed to create ProcessedImageMetadata: {str(e)}")
            return ProcessedImageMetadata()

    def _determine_processing_status(self, metadata: ProcessedImageMetadata) -> ProcessingStatus:
        """
        Determine processing status based on metadata completeness

        Args:
            metadata: ProcessedImageMetadata instance

        Returns:
            ProcessingStatus based on data quality
        """
        try:
            # Check if we have description
            has_description = bool(metadata.description and len(metadata.description.strip()) > 5)
            # Check if we have meaningful metadata
            has_metadata = bool(metadata.metadata and len(metadata.metadata) > 0)
            # Check if we have category
            has_category = bool(metadata.category and len(metadata.category.strip()) > 0)
            # Determine status based on completeness
            if has_description and len(metadata.description.strip()) > 20:
                return ProcessingStatus.SUCCESS
            elif has_description or has_metadata or has_category:
                return ProcessingStatus.PARTIAL
            else:
                return ProcessingStatus.FAILED

        except Exception as e:
            self.logger.error(f"Error determining processing status: {str(e)}")
            return ProcessingStatus.FAILED
