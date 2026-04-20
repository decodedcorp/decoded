import grpc
import base64
import os
from src.grpc.proto.inbound import inbound_pb2, inbound_pb2_grpc
from src.config._logger import LoggerService
from src.managers.redis._manager import RedisManager
from src.database.models.content import ProcessingStatus
from src.services.metadata.core import MetadataExtractService
from src.services.post_context import PostContextService


class MetadataServicer(inbound_pb2_grpc.QueueServicer):
    def __init__(
        self,
        redis_manager: RedisManager,
        logger: LoggerService,
        metadata_extract_service: MetadataExtractService,
        queue_manager,
    ):
        self.redis_manager = redis_manager
        self.logger = logger
        self.metadata_extract_service = metadata_extract_service
        self.queue_manager = queue_manager

    async def AnalyzeLinkDirect(
        self,
        request: inbound_pb2.AnalyzeLinkRequest,
        context,
    ) -> inbound_pb2.AnalyzeLinkDirectResponse:
        """Analyze link immediately (synchronously) and return result"""
        try:
            url = request.url
            solution_id = (
                request.post_id
            )  # Note: proto field is still 'post_id' but represents solution_id
            title = request.title
            description = request.description
            site_name = request.site_name

            if not url:
                raise ValueError("URL is required")

            self.logger.info(f"Received AnalyzeLinkDirect request for {url}")

            # Check if metadata service is available
            if not self.metadata_extract_service:
                raise ValueError("Metadata service not properly initialized")

            # Prepare OG metadata
            og_metadata = {"title": title, "description": description, "site_name": site_name}

            # Process directly
            try:
                result = await self.metadata_extract_service._analyze_link(
                    url=url,
                    item_id=solution_id,  # solution_id used as item_id
                    og_metadata=og_metadata,
                )
            except ValueError as e:
                # OG metadata required but not provided
                self.logger.warning(f"AnalyzeLinkDirect validation error: {str(e)}")
                context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
                context.set_details(str(e))
                return inbound_pb2.AnalyzeLinkDirectResponse(
                    success=False, message="OG metadata required", error_message=str(e)
                )

            if result.status == ProcessingStatus.SUCCESS and result.metadata:
                metadata = result.metadata

                # Convert QnA
                qna_list = []
                if metadata.qa_pairs:
                    for qa in metadata.qa_pairs:
                        qna_list.append(inbound_pb2.QAPair(question=qa.question, answer=qa.answer))

                # Convert metadata based on link_type (oneof)
                response_kwargs = {
                    "success": True,
                    "message": "Analysis successful",
                    "summary": metadata.summary or "",
                    "keywords": metadata.keywords or [],
                    "qna": qna_list,
                    "error_message": "",
                }

                # oneof: link_type에 따라 적절한 metadata 설정
                if metadata.link_type == "product" and metadata.metadata:
                    response_kwargs["product_metadata"] = inbound_pb2.ProductMetadata(
                        category=metadata.metadata.get("category", ""),
                        sub_category=metadata.metadata.get("sub_category", ""),
                        brand=metadata.metadata.get("brand", ""),
                        price=metadata.metadata.get("price", ""),
                        currency=metadata.metadata.get("currency", ""),
                        materials=metadata.metadata.get("material", []),
                        origin=metadata.metadata.get("origin", ""),
                    )
                elif metadata.link_type == "article" and metadata.metadata:
                    response_kwargs["article_metadata"] = inbound_pb2.ArticleMetadata(
                        category=metadata.metadata.get("category", ""),
                        sub_category=metadata.metadata.get("sub_category", ""),
                        author=metadata.metadata.get("author", ""),
                        published_date=metadata.metadata.get("published_date", ""),
                        reading_time=metadata.metadata.get("reading_time", ""),
                        topics=metadata.metadata.get("topics", []),
                    )
                elif metadata.link_type == "video" and metadata.metadata:
                    response_kwargs["video_metadata"] = inbound_pb2.VideoMetadata(
                        category=metadata.metadata.get("category", ""),
                        sub_category=metadata.metadata.get("sub_category", ""),
                        channel=metadata.metadata.get("channel", ""),
                        duration=metadata.metadata.get("duration", ""),
                        view_count=metadata.metadata.get("view_count", ""),
                        upload_date=metadata.metadata.get("upload_date", ""),
                    )
                else:  # other
                    response_kwargs["other_metadata"] = inbound_pb2.OtherMetadata(
                        category=metadata.metadata.get("category", ""),
                        sub_category=metadata.metadata.get("sub_category", ""),
                        content_type=metadata.metadata.get("content_type", ""),
                    )

                return inbound_pb2.AnalyzeLinkDirectResponse(**response_kwargs)
            else:
                return inbound_pb2.AnalyzeLinkDirectResponse(
                    success=False,
                    message="Analysis failed",
                    error_message=result.error_message or "Unknown error",
                )

        except Exception as e:
            self.logger.error(f"Error in AnalyzeLinkDirect: {str(e)}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return inbound_pb2.AnalyzeLinkDirectResponse(
                success=False, message="Internal error", error_message=str(e)
            )

    async def ExtractOGData(
        self,
        request: inbound_pb2.ExtractOGDataRequest,
        context,
    ) -> inbound_pb2.ExtractOGDataResponse:
        """Extract OG metadata synchronously"""
        try:
            url = request.url
            if not url:
                raise ValueError("URL is required")

            self.logger.debug(f"Received ExtractOGData request for {url}")

            # Extract OG data synchronously
            link_preview = await self.metadata_extract_service.extract_og_metadata(url=url)
            if link_preview is None:
                raise Exception("Error on extracting link preview")
            else:
                return inbound_pb2.ExtractOGDataResponse(
                    success=True,
                    url=url,
                    title=link_preview.title or "",
                    description=link_preview.description or "",
                    image=link_preview.img_url or "",
                    site_name=link_preview.site_name or "",
                    error_message="",
                )

        except ValueError as e:
            self.logger.warning(f"Invalid ExtractOGData request: {str(e)}")
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details(str(e))
            return inbound_pb2.ExtractOGDataResponse(
                success=False,
                url=request.url if request.url else "",
                title="",
                description="",
                image="",
                site_name="",
                error_message=str(e),
            )

        except Exception as e:
            self.logger.error(f"Error extracting OG data: {str(e)}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return inbound_pb2.ExtractOGDataResponse(
                success=False,
                url=request.url if request.url else "",
                title="",
                description="",
                image="",
                site_name="",
                error_message=str(e),
            )

    async def AnalyzeLink(
        self,
        request: inbound_pb2.AnalyzeLinkRequest,
        context,
    ) -> inbound_pb2.AnalyzeLinkResponse:
        """Enqueue AI analysis request to Redis queue"""
        try:
            url = request.url
            solution_id = (
                request.post_id
            )  # Note: proto field is still 'post_id' but represents solution_id
            title = request.title
            description = request.description
            site_name = request.site_name

            if not url:
                raise ValueError("URL is required")
            if not solution_id:
                raise ValueError("solution_id is required")

            self.logger.debug(f"Received AnalyzeLink request for solution_id: {solution_id}")

            # Servicer가 직접 QueueManager 사용
            job_id = await self.queue_manager.enqueue_job(
                "analyze_link_job",  # job name
                url,
                solution_id,  # Pass as solution_id
                title,
                description,
                site_name,
            )

            success = job_id is not None

            if success:
                self.logger.debug(
                    f"AI analysis request enqueued for solution_id: {solution_id} (job_id: {job_id})"
                )
                return inbound_pb2.AnalyzeLinkResponse(
                    success=True,
                    message=f"AI analysis request enqueued for solution_id: {solution_id}",
                    batch_id=job_id or "",
                )
            else:
                raise Exception("Failed to enqueue analysis request")

        except ValueError as e:
            self.logger.warning(f"Invalid AnalyzeLink request: {str(e)}")
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details(str(e))
            return inbound_pb2.AnalyzeLinkResponse(
                success=False, message=f"Invalid request: {str(e)}", batch_id=""
            )

        except Exception as e:
            self.logger.error(f"Error enqueuing AI analysis: {str(e)}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return inbound_pb2.AnalyzeLinkResponse(
                success=False, message=f"Failed to enqueue analysis request: {str(e)}", batch_id=""
            )

    async def ProcessPostEditorial(
        self,
        request: inbound_pb2.ProcessPostEditorialRequest,
        context,
    ) -> inbound_pb2.ProcessPostEditorialResponse:
        """Enqueue post editorial pipeline to Redis queue."""
        try:
            post_magazine_id = request.post_magazine_id
            post_data_json = request.post_data_json

            if not post_magazine_id:
                raise ValueError("post_magazine_id is required")
            if not post_data_json:
                raise ValueError("post_data_json is required")

            self.logger.debug(
                f"Received ProcessPostEditorial request for magazine {post_magazine_id}"
            )

            job_id = await self.queue_manager.enqueue_job(
                "post_editorial_job",
                post_magazine_id,
                post_data_json,
            )

            success = job_id is not None

            if success:
                self.logger.debug(
                    f"Post editorial enqueued for {post_magazine_id} (job_id: {job_id})"
                )
                return inbound_pb2.ProcessPostEditorialResponse(
                    success=True,
                    message=f"Post editorial enqueued for magazine {post_magazine_id}",
                    batch_id=job_id or "",
                )
            else:
                raise Exception("Failed to enqueue post editorial")

        except ValueError as e:
            self.logger.warning(f"Invalid ProcessPostEditorial request: {str(e)}")
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details(str(e))
            return inbound_pb2.ProcessPostEditorialResponse(
                success=False,
                message=f"Invalid request: {str(e)}",
                batch_id="",
            )

        except Exception as e:
            self.logger.error(f"Error enqueuing post editorial: {str(e)}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return inbound_pb2.ProcessPostEditorialResponse(
                success=False,
                message=f"Failed to enqueue post editorial: {str(e)}",
                batch_id="",
            )

    async def AnalyzeImage(
        self,
        request: inbound_pb2.AnalyzeImageRequest,
        context,
    ) -> inbound_pb2.AnalyzeImageResponse:
        """Analyze image immediately (synchronously) and return result"""
        try:
            image_data_base64 = request.image_data
            item_id = request.item_id or "unknown"

            if not image_data_base64:
                raise ValueError("image_data is required")

            self.logger.info(f"Received AnalyzeImage request for item_id: {item_id}")

            # Decode base64 image
            try:
                image_data = base64.b64decode(image_data_base64)
            except Exception as e:
                raise ValueError(f"Invalid base64 image data: {str(e)}")

            # Parse category rules
            category_rules = {}
            for rule in request.category_rules:
                category_rules[rule.category] = list(rule.sub_categories)

            # Check if metadata service is available
            if not self.metadata_extract_service:
                raise ValueError("Metadata service not properly initialized")

            # Get image processor from metadata service
            if not hasattr(self.metadata_extract_service, "image_processor"):
                raise ValueError("Image processor not available")

            image_processor = self.metadata_extract_service.image_processor

            # Process image with category rules
            result = await image_processor.process_image_data(
                image_data=image_data, item_id=item_id, category_rules=category_rules
            )

            if result.status == ProcessingStatus.SUCCESS and result.metadata:
                metadata = result.metadata

                # Convert items map
                items_map = {}
                if hasattr(metadata, "items") and metadata.items:
                    for category, items_list in metadata.items.items():
                        item_list = inbound_pb2.ItemList()
                        for item in items_list:
                            item_with_coords = inbound_pb2.ItemWithCoordinates(
                                sub_category=item.get("sub_category", ""),
                                type=item.get("type", ""),
                                top=item.get("top") if item.get("top") is not None else 0,
                                left=item.get("left") if item.get("left") is not None else 0,
                            )
                            item_list.items.append(item_with_coords)
                        items_map[category] = item_list

                return inbound_pb2.AnalyzeImageResponse(
                    success=True,
                    subject=getattr(metadata, "subject", ""),
                    title=getattr(metadata, "title", ""),
                    artist_name=getattr(metadata, "artist_name", None),
                    group_name=getattr(metadata, "group_name", None),
                    context=getattr(metadata, "context", None),
                    items=items_map,
                    error_message="",
                )
            else:
                return inbound_pb2.AnalyzeImageResponse(
                    success=False,
                    subject="",
                    title="",
                    error_message=result.error_message or "Image analysis failed",
                )

        except ValueError as e:
            self.logger.warning(f"Invalid AnalyzeImage request: {str(e)}")
            context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
            context.set_details(str(e))
            return inbound_pb2.AnalyzeImageResponse(
                success=False, subject="", title="", error_message=str(e)
            )

        except Exception as e:
            self.logger.error(f"Error in AnalyzeImage: {str(e)}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return inbound_pb2.AnalyzeImageResponse(
                success=False, subject="", title="", error_message=str(e)
            )

    async def ExtractPostContext(
        self,
        request: inbound_pb2.ExtractPostContextRequest,
        context,
    ) -> inbound_pb2.ExtractPostContextResponse:
        """Extract context and style_tags from post image using Ollama vision."""
        try:
            post_id = request.post_id
            image_url = request.image_url

            if not post_id or not image_url:
                raise ValueError("post_id and image_url are required")

            self.logger.info(f"ExtractPostContext for post {post_id}")

            service = PostContextService()
            # asyncpg pool via DI — DATABASE_URL 로 투명 전환 (#266)
            from src.config._container import Application

            app = Application()
            database_manager = app.infrastructure().database_manager()

            result = await service.extract_and_update(post_id, image_url, database_manager)

            return inbound_pb2.ExtractPostContextResponse(
                success=True,
                context=result.get("context", ""),
                style_tags=result.get("style_tags", []),
                mood=result.get("mood", ""),
                setting=result.get("setting", ""),
                error_message="",
            )

        except Exception as e:
            self.logger.error(f"ExtractPostContext failed: {str(e)}", exc_info=True)
            return inbound_pb2.ExtractPostContextResponse(
                success=False,
                context="",
                style_tags=[],
                mood="",
                setting="",
                error_message=str(e),
            )
