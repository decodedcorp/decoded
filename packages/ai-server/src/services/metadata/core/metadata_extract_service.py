from typing import Optional, Dict, Any
import logging
from src.database.models.content import LinkPreviewMetadata, LinkProcessingResult, ProcessingStatus
from src.services.base import business_service
from src.services.metadata.core.result_aggregator import ResultAggregator
from src.services.metadata.clients.web_scraper import WebScraperService
from src.services.metadata.extractors.og_extractor import OGTagExtractor
from src.services.metadata.extractors.link_og_extractor import LinkOGExtractor
from src.services.metadata.processors.link_ai_analyzer import LinkAIAnalyzer
from src.services.metadata.processors.link_type_classifier import LinkTypeClassifier
from src.managers.llm.routing import LLMRouter
from src.managers.llm.base import LLMConfig
from src.managers.llm.adapters.gemini import GeminiClient
from src.managers.llm.adapters.perplexity import PerplexityClient
from src.managers.llm.adapters.groq import GroqClient
from src.managers.llm.adapters.agent import DefaultLLMAgent
from src.services.metadata.clients.searxng_client import SearXNGClient
from src.services.metadata.processors.image_processor import ImageProcessor
from src.services.metadata.management.failed_items_manager import FailedItemsManager


@business_service
class MetadataExtractService:
    """Service for coordinating metadata extraction operations"""

    def __init__(
        self,
        environment,
        redis_manager,
        failed_items_manager: FailedItemsManager,
        llm_router: LLMRouter,
        logger=None,
    ):
        super().__init__()
        self.environment = environment
        self.redis_manager = redis_manager
        self.failed_items_manager = failed_items_manager
        self.llm_router = llm_router
        self.logger = logger or logging.getLogger(__name__)

        # ResultAggregator
        self.result_aggregator = ResultAggregator(environment, redis_manager)

        # Initialize components (from manager)
        self._initialize_components()

        self.logger.debug("MetadataExtractService instance created.")

    def _initialize_components(self):
        """Initialize all processing components"""
        try:
            # Initialize web scraping components
            self.web_scraper = WebScraperService(
                max_retries=self.environment.MAX_RETRIES,
                timeout=self.environment.REQUEST_TIMEOUT
            )
            self.og_extractor = OGTagExtractor()

            # Validate required dependencies (no fallback - DI must provide these)
            if self.llm_router is None:
                raise ValueError(
                    "LLM router is required. Ensure MetadataContainer provides llm_router."
                )

            # Initialize SearXNG client for OG extraction
            searxng_client = SearXNGClient(self.environment)

            # Initialize new separated components
            self.link_og_extractor = LinkOGExtractor(
                web_scraper=self.web_scraper,
                og_extractor=self.og_extractor,
                searxng_client=searxng_client,
                environment=self.environment,
            )

            # Initialize Groq client for LinkTypeClassifier (fast inference)
            groq_client = GroqClient(environment=self.environment)
            link_type_classifier = LinkTypeClassifier(groq_client=groq_client)

            # Initialize Gemini client (Primary) for LinkAIAnalyzer
            gemini_model = getattr(self.environment, 'GEMINI_MODEL', 'gemini-3-flash-preview')
            gemini_config = LLMConfig(
                provider="gemini",
                model=gemini_model,
                api_key=getattr(self.environment, 'GEMINI_API_KEY', '')
            )
            gemini_client = GeminiClient(gemini_config, environment=self.environment)

            # Initialize Perplexity client (Fallback) for LinkAIAnalyzer
            perplexity_client = PerplexityClient(environment=self.environment)

            # Create Default LLM Agent (Gemini -> Perplexity)
            llm_agent = DefaultLLMAgent(
                primary=perplexity_client,
                fallback=gemini_client
            )

            self.link_ai_analyzer = LinkAIAnalyzer(
                llm_client=llm_agent,  
                link_type_classifier=link_type_classifier,
                environment=self.environment,
            )

            self.image_processor = ImageProcessor(
                web_scraper=self.web_scraper,
                llm_client=self.llm_router
            )

            self.logger.debug("Metadata extraction components initialized successfully")

        except Exception as e:
            self.logger.error(f"Failed to initialize components: {str(e)}")
            raise


    async def extract_og_metadata(self, url: str) -> Optional[LinkPreviewMetadata]:
        """
        Extract OG metadata of given `url`

        Args:
            url: URL to extract OG metadata from

        Returns:
            Optional[LinkPreviewMetadata]
        """
        try:
            return await self.link_og_extractor.extract(url=url)
        except Exception as e:
            return None
    
    async def _analyze_link(
        self,
        url: str,
        item_id: str,
        og_metadata: Dict[str, str]
    ) -> LinkProcessingResult:
        """
        Analyze a link with AI (internal method)
        OG metadata is REQUIRED - no fallback extraction.
        Used internally by analyze_link_job and AnalyzeLinkDirect RPC.

        Args:
            url: URL to analyze
            item_id: Item identifier (solution_id from backend)
            og_metadata: OG metadata dict (title, description, site_name) - REQUIRED

        Returns:
            LinkProcessingResult with AI analysis

        Raises:
            ValueError: If og_metadata is empty or missing required fields
        """
        self.logger.debug(f"Analyzing link for {item_id}")

        # OG metadata is now REQUIRED - no fallback extraction
        if not og_metadata or not og_metadata.get("title"):
            raise ValueError(
                "OG metadata is required for AI analysis. "
                "Call ExtractOGData first to obtain OG metadata."
            )

        try:
            result = await self.link_ai_analyzer.analyze(
                url=url,
                item_id=item_id,
                og_metadata=og_metadata
            )
            return result

        except Exception as e:
            self.logger.error(f"Error analyzing link for {url}: {str(e)}", exc_info=True)
            return LinkProcessingResult(
                item_id=item_id,
                url=url,
                status=ProcessingStatus.FAILED,
                error_message=str(e)
            )
    
    @staticmethod
    async def analyze_link_job(
        ctx: Dict[str, Any],
        url: str,
        solution_id: str,
        title: str = "",
        description: str = "",
        site_name: str = ""
    ) -> Dict[str, Any]:
        """
        ARQ job for link analysis
        Static method for ARQ compatibility (pickle-able)

        Args:
            ctx: ARQ context with injected services
            url: URL to analyze
            solution_id: Solution ID from backend (used as item_id)
            title: OG title
            description: OG description
            site_name: OG site name

        Returns:
            Dict with processing results
        """
        import logging
        logger = logging.getLogger(__name__)
        
        service = ctx.get('metadata_extract_service')
        if not service:
            return {"success": False, "error": "Service not available"}

        og_metadata = {
            "title": title,
            "description": description,
            "site_name": site_name
        }

        try:
            # 비즈니스 로직 실행
            result = await service._analyze_link(
                url=url,
                item_id=solution_id,
                og_metadata=og_metadata
            )

            # 상태별 처리
            result_batch_service = ctx.get('result_batch_service')
            failed_items_manager = ctx.get('failed_items_manager')

            if result.status == ProcessingStatus.FAILED:
                # 실패: FailedItemsManager로 전달 (버퍼링 안 함)
                if failed_items_manager:
                    await failed_items_manager.add_failed_item(
                        item_id=solution_id,
                        url=url,
                        item_type="link",
                        error_message=result.error_message or "Unknown error"
                    )
            elif result.status == ProcessingStatus.PARTIAL:
                # 부분 성공: 버퍼링 + FailedItemsManager 등록
                if result_batch_service:
                    await result_batch_service.buffer_result(result)
                if failed_items_manager:
                    await failed_items_manager.add_partial_item(
                        item_id=solution_id,
                        url=url,
                        item_type="link",
                        missing_fields=[],  # TODO: 실제 누락 필드 파악
                        current_metadata=result.metadata.model_dump() if result.metadata else {}
                    )
            else:  # SUCCESS
                # 성공: 버퍼링만
                if result_batch_service:
                    await result_batch_service.buffer_result(result)

            return {
                "success": result.status == ProcessingStatus.SUCCESS,
                "url": url,
                "solution_id": solution_id,
                "status": result.status.value
            }
        except Exception as e:
            logger.error(f"Error in analyze_link_job: {str(e)}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "url": url,
                "solution_id": solution_id
            }

