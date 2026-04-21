from dependency_injector.containers import (
    DeclarativeContainer,
    WiringConfiguration,
)
from dependency_injector.providers import (
    Singleton,
    Callable,
    DependenciesContainer,
    Dependency,
    Container,
)
from ._environment import Environment
from ._logger import LoggerService, get_logger
from src.managers.redis._manager import RedisManager
from src.managers.queue.queue_manager import QueueManager
from src.managers.storage.r2_client import R2Client
from src.managers.database import DatabaseManager
from src.services.metadata.core.metadata_extract_service import MetadataExtractService
from src.services.metadata.core.result_batch_service import ResultBatchService
from src.services.metadata.management.failed_items_manager import FailedItemsManager
from src.services.media.repository import MediaRepository
from src.services.media.scheduler import MediaParseScheduler
from src.services.media.seed_writer import SeedWriter
from src.services.media.vision_parser import MediaVisionParser
from src.services.raw_posts.adapters import build_default_adapters
from src.services.raw_posts.pipeline import RawPostsPipeline
from src.services.raw_posts.repository import RawPostsRepository
from src.services.raw_posts.scheduler import RawPostsScheduler
from src.grpc.client.backend_client import GRPCBackendClient
from src.managers.llm.adapters.perplexity import PerplexityClient
from src.managers.llm.adapters.local_llm import LocalLLMClient
from src.managers.llm.adapters.groq import GroqClient
from src.managers.llm.routing.router import LLMRouter
from src.managers.llm.routing.content_resolver import ContentTypeResolver
from src.services.metadata.clients.searxng_client import SearXNGClient
from src.services.metadata.extractors.youtube_extractor import YouTubeExtractor
from src.services.metadata.extractors.og_extractor import OGTagExtractor
from src.services.metadata.clients.web_scraper import WebScraperService
from src.grpc.servicer import MetadataServicer


# Infrastructure Layer
class InfrastructureContainer(DeclarativeContainer):
    environment: Dependency[Environment] = Dependency(Environment)
    logger: Dependency[LoggerService] = Dependency(LoggerService)

    redis_manager: Singleton[RedisManager] = Singleton(
        RedisManager,
        redis_config=environment.provided.redis_config.call(),
        logger=logger,
    )

    # QueueManager - generic queue infrastructure
    queue_manager: Singleton[QueueManager] = Singleton(
        QueueManager,
        environment=environment,
        logger=logger,
    )

    # Raw Posts — Cloudflare R2 client (#258)
    r2_client: Singleton[R2Client] = Singleton(
        R2Client,
        environment=environment,
    )

    # #214 raw_posts_callback_client removed — ai-server writes DB directly.

    # Postgres direct access — asyncpg pool. DATABASE_URL로 로컬/prod 투명 전환.
    database_manager: Singleton[DatabaseManager] = Singleton(
        DatabaseManager,
        environment=environment,
    )


# Metadata Domain Container
class MetadataContainer(DeclarativeContainer):
    environment: Dependency[Environment] = Dependency(Environment)
    logger: Dependency[LoggerService] = Dependency(LoggerService)
    infrastructure: DependenciesContainer[InfrastructureContainer] = DependenciesContainer()

    # LLM Clients
    perplexity_client: Singleton[PerplexityClient] = Singleton(
        PerplexityClient,
        environment=environment,
    )

    searxng_client: Singleton[SearXNGClient] = Singleton(SearXNGClient, environment=environment)

    # Web scraping components
    web_scraper: Singleton[WebScraperService] = Singleton(
        WebScraperService,
        max_retries=Callable(lambda env: env.MAX_RETRIES, environment),
        timeout=Callable(lambda env: env.REQUEST_TIMEOUT, environment),
    )

    og_extractor: Singleton[OGTagExtractor] = Singleton(OGTagExtractor)

    youtube_extractor: Singleton[YouTubeExtractor] = Singleton(
        YouTubeExtractor, og_extractor=og_extractor
    )

    local_llm_client: Singleton[LocalLLMClient] = Singleton(
        LocalLLMClient, environment=environment, searxng_client=searxng_client
    )

    groq_client: Singleton[GroqClient] = Singleton(
        GroqClient,
        environment=environment,
    )

    content_resolver: Singleton[ContentTypeResolver] = Singleton(ContentTypeResolver)

    # LLM Router with multiple clients per content type
    llm_router: Singleton[LLMRouter] = Singleton(
        LLMRouter,
        client_mapping={
            "link": [
                perplexity_client,
                groq_client,
                local_llm_client,
            ],  # Perplexity client (SDK-based) as first option
            "image": perplexity_client,  # Perplexity client for images
            "text": perplexity_client,  # Perplexity client for text
        },
        fallback_provider="text",
        content_resolver=content_resolver,
    )

    # Failed Items Management (정의를 먼저 해야 함)
    failed_items_manager: Singleton[FailedItemsManager] = Singleton(
        FailedItemsManager,
        redis_manager=infrastructure.redis_manager,
        max_retry_count=Callable(lambda env: env.MAX_RETRIES, environment),
    )

    # Metadata Processing Pipeline
    metadata_extract_service: Singleton[MetadataExtractService] = Singleton(
        MetadataExtractService,
        environment=environment,
        redis_manager=infrastructure.redis_manager,
        failed_items_manager=failed_items_manager,
        llm_router=llm_router,
        logger=logger,
    )

    # Backend Client for batch sending
    backend_client: Singleton[GRPCBackendClient] = Singleton(
        GRPCBackendClient,
        host=Callable(lambda env: env.grpc_backend_host, environment),
        port=Callable(lambda env: env.grpc_backend_port, environment),
        logger=logger,
    )

    # Result Batch Service
    result_batch_service: Singleton[ResultBatchService] = Singleton(
        ResultBatchService,
        redis_manager=infrastructure.redis_manager,
        backend_client=backend_client,
        environment=environment,
        logger=logger,
    )


# Raw Posts Domain Container (#258)
class RawPostsContainer(DeclarativeContainer):
    environment: Dependency[Environment] = Dependency(Environment)
    logger: Dependency[LoggerService] = Dependency(LoggerService)
    infrastructure: DependenciesContainer[InfrastructureContainer] = DependenciesContainer()

    adapters = Callable(build_default_adapters, environment=environment)

    repository: Singleton[RawPostsRepository] = Singleton(
        RawPostsRepository,
        database_manager=infrastructure.database_manager,
    )

    pipeline: Singleton[RawPostsPipeline] = Singleton(
        RawPostsPipeline,
        r2_client=infrastructure.r2_client,
        adapters=adapters,
        repository=repository,
        download_timeout=Callable(lambda env: env.RAW_POSTS_DOWNLOAD_TIMEOUT, environment),
    )

    scheduler: Singleton[RawPostsScheduler] = Singleton(
        RawPostsScheduler,
        repository=repository,
        pipeline=pipeline,
        interval_seconds=Callable(
            lambda env: env.RAW_POSTS_SCHEDULER_INTERVAL_SECONDS, environment
        ),
    )


# Media Parsing Domain Container (#260)
class MediaContainer(DeclarativeContainer):
    environment: Dependency[Environment] = Dependency(Environment)
    logger: Dependency[LoggerService] = Dependency(LoggerService)
    infrastructure: DependenciesContainer[InfrastructureContainer] = DependenciesContainer()

    repository: Singleton[MediaRepository] = Singleton(
        MediaRepository,
        database_manager=infrastructure.database_manager,
    )

    vision_parser: Singleton[MediaVisionParser] = Singleton(
        MediaVisionParser,
        environment=environment,
    )

    seed_writer: Singleton[SeedWriter] = Singleton(
        SeedWriter,
        database_manager=infrastructure.database_manager,
    )

    scheduler: Singleton[MediaParseScheduler] = Singleton(
        MediaParseScheduler,
        repository=repository,
        parser=vision_parser,
        writer=seed_writer,
        r2_client=infrastructure.r2_client,
        interval_seconds=Callable(
            lambda env: env.MEDIA_PARSE_INTERVAL_SECONDS, environment
        ),
        batch_size=Callable(lambda env: env.MEDIA_PARSE_BATCH_SIZE, environment),
        max_attempts=Callable(lambda env: env.MEDIA_PARSE_MAX_ATTEMPTS, environment),
    )


# GRPC API Layer
class GRPCContainer(DeclarativeContainer):
    environment: Dependency[Environment] = Dependency(Environment)
    logger: Dependency[LoggerService] = Dependency(LoggerService)
    infrastructure: DependenciesContainer[InfrastructureContainer] = DependenciesContainer()
    metadata: DependenciesContainer[MetadataContainer] = DependenciesContainer()

    metadata_servicer: Singleton[MetadataServicer] = Singleton(
        MetadataServicer,
        redis_manager=infrastructure.redis_manager,
        logger=logger,
        metadata_extract_service=metadata.metadata_extract_service,
        queue_manager=infrastructure.queue_manager,
    )

    # #214 RawPostsWorkerServicer removed — ai-server schedules itself.


class Application(DeclarativeContainer):
    wiring_config = WiringConfiguration(
        auto_wire=False,
        modules=[],
    )

    environment: Dependency[Environment] = Dependency(
        Environment,
        default=Environment.from_environ(),
    )

    logger: Callable[LoggerService] = Callable(
        get_logger,
        environment=environment,
    )

    # Infrastructure Layer
    infrastructure: Container[InfrastructureContainer] = Container(
        InfrastructureContainer,
        environment=environment,
        logger=logger,
    )

    # Metadata Domain Layer
    metadata: Container[MetadataContainer] = Container(
        MetadataContainer,
        environment=environment,
        logger=logger,
        infrastructure=infrastructure,
    )

    # Raw Posts Domain Layer (#258)
    raw_posts: Container[RawPostsContainer] = Container(
        RawPostsContainer,
        environment=environment,
        logger=logger,
        infrastructure=infrastructure,
    )

    # Media Parsing Domain Layer (#260)
    media: Container[MediaContainer] = Container(
        MediaContainer,
        environment=environment,
        logger=logger,
        infrastructure=infrastructure,
    )

    # GRPC API Layer
    grpc: Container[GRPCContainer] = Container(
        GRPCContainer,
        environment=environment,
        logger=logger,
        infrastructure=infrastructure,
        metadata=metadata,
    )
