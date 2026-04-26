//! Application state.
//!
//! `AppState` 는 모든 핸들러에 주입되는 공유 상태다. 외부 의존성은 Trait 으로 추상화돼
//! 있어 구현체 교체가 용이하다. DB 풀은 두 개(prod / assets) 가 공존한다 (#333).

use sea_orm::DatabaseConnection;
use std::sync::Arc;

use crate::config::AppConfig;
use crate::domains::categories::CategoryCache;
use crate::domains::posts::cache::PostListCache;
use crate::metrics::MetricsStore;
use crate::services::{
    AffiliateClient, CloudflareR2Client, DecodedAIGrpcClient, DummyEmbeddingClient,
    EmbeddingClient, MeilisearchClient, OpenAIEmbeddingClient, RakutenAffiliateClient,
    SearchClient, StorageClient,
};

/// 애플리케이션 상태
///
/// Trait 기반으로 외부 서비스를 추상화하여 구현체에 종속되지 않도록 합니다.
#[derive(Clone)]
pub struct AppState {
    /// prod 프로젝트 pool — public.posts, users, solutions 등 검증본 데이터.
    pub db: Arc<DatabaseConnection>,
    /// assets 프로젝트 pool — raw_post_sources, raw_posts, pipeline_events (#333).
    pub assets_db: Arc<DatabaseConnection>,
    pub config: AppConfig,

    // Caches
    pub category_cache: Arc<CategoryCache>,
    pub post_list_cache: Arc<PostListCache>,

    // Trait 기반 클라이언트
    pub storage_client: Arc<dyn StorageClient>,
    pub search_client: Arc<dyn SearchClient>,
    pub affiliate_client: Arc<dyn AffiliateClient>,
    pub embedding_client: Arc<dyn EmbeddingClient>,

    // gRPC Client
    pub decoded_ai_client: Arc<DecodedAIGrpcClient>,

    // Metrics
    pub metrics: Arc<MetricsStore>,
}

impl AppState {
    /// 새로운 AppState 생성
    pub async fn new(config: AppConfig) -> Result<Self, sea_orm::DbErr> {
        Self::with_db_connection(config, None).await
    }

    /// DB 연결을 받아서 AppState 생성 (마이그레이션 후 재사용용).
    /// prod pool 은 optional (마이그레이션용 연결 재활용), assets pool 은 내부에서 자체 오픈.
    pub async fn with_db_connection(
        config: AppConfig,
        db: Option<DatabaseConnection>,
    ) -> Result<Self, sea_orm::DbErr> {
        let db = Arc::new(match db {
            Some(conn) => conn,
            None => config.create_db_connection().await?,
        });
        let assets_db = Arc::new(config.create_assets_db_connection().await?);
        tracing::info!("Assets DB connection established");

        let storage_client: Arc<dyn StorageClient> =
            match CloudflareR2Client::new(&config.storage).await {
                Ok(client) => {
                    tracing::info!("CloudflareR2Client initialized successfully");
                    Arc::new(client)
                }
                Err(e) => {
                    tracing::warn!(
                        "Failed to initialize CloudflareR2Client: {}. Using DummyStorageClient",
                        e
                    );
                    Arc::new(crate::services::DummyStorageClient::default())
                }
            };

        let search_client: Arc<dyn SearchClient> = match MeilisearchClient::new(&config.search) {
            Ok(client) => {
                tracing::info!("MeilisearchClient initialized successfully");
                Arc::new(client)
            }
            Err(e) => {
                tracing::warn!(
                    "Failed to initialize MeilisearchClient: {}. Using DummySearchClient",
                    e
                );
                Arc::new(crate::services::DummySearchClient)
            }
        };

        let affiliate_client: Arc<dyn AffiliateClient> =
            match RakutenAffiliateClient::new(&config.affiliate) {
                Ok(client) => {
                    tracing::info!("RakutenAffiliateClient initialized successfully");
                    Arc::new(client)
                }
                Err(e) => {
                    tracing::warn!(
                    "Failed to initialize RakutenAffiliateClient: {}. Using DummyAffiliateClient",
                    e
                );
                    Arc::new(crate::services::DummyAffiliateClient)
                }
            };

        let embedding_client: Arc<dyn EmbeddingClient> =
            match OpenAIEmbeddingClient::new(&config.embedding) {
                Ok(client) => {
                    tracing::info!("OpenAIEmbeddingClient initialized successfully");
                    Arc::new(client)
                }
                Err(e) => {
                    tracing::warn!(
                    "Failed to initialize OpenAIEmbeddingClient: {}. Using DummyEmbeddingClient",
                    e
                );
                    Arc::new(DummyEmbeddingClient)
                }
            };

        // Cache 초기화
        let category_cache = Arc::new(CategoryCache::new());
        let post_list_cache = Arc::new(PostListCache::new());
        tracing::info!("CategoryCache, PostListCache initialized successfully");

        // DecodedAIGrpcClient 초기화 (lazy connect - 실제 연결은 첫 RPC 시점에 수행)
        let grpc_url = config.ai_service.url.trim().to_string();
        let decoded_ai_client = match DecodedAIGrpcClient::new(grpc_url.clone()) {
            Ok(client) => {
                tracing::info!(
                    "DecodedAIGrpcClient initialized successfully (url={})",
                    grpc_url
                );
                Arc::new(client)
            }
            Err(e) => {
                tracing::error!(
                    "Failed to initialize DecodedAIGrpcClient (url={:?}): {}",
                    grpc_url,
                    e
                );
                return Err(sea_orm::DbErr::Custom(format!(
                    "DecodedAIGrpcClient init failed: {}",
                    e
                )));
            }
        };

        Ok(Self {
            db,
            assets_db,
            config,
            category_cache,
            post_list_cache,
            storage_client,
            search_client,
            affiliate_client,
            embedding_client,
            decoded_ai_client,
            metrics: Arc::new(MetricsStore::new()),
        })
    }
}
