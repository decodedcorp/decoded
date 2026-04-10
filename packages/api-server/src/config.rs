use sea_orm::{ConnectOptions, Database, DatabaseConnection};
use std::sync::Arc;
use std::time::Duration;

use crate::domains::categories::CategoryCache;
use crate::services::{
    AffiliateClient, CloudflareR2Client, DecodedAIGrpcClient, DummyEmbeddingClient,
    EmbeddingClient, MeilisearchClient, OpenAIEmbeddingClient, RakutenAffiliateClient,
    SearchClient, StorageClient,
};

/// Reads `primary` env, then legacy alias if unset (migration from older names).
fn env_primary_or_legacy(primary: &str, legacy: &str) -> Option<String> {
    std::env::var(primary)
        .ok()
        .or_else(|| std::env::var(legacy).ok())
}

/// 애플리케이션 설정
#[derive(Debug, Clone)]
pub struct AppConfig {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub auth: AuthConfig,
    pub storage: StorageConfig,
    pub search: SearchConfig,
    pub affiliate: AffiliateConfig,
    pub ai_service: AiServiceConfig,
    pub agent_service: AgentServiceConfig,
    pub embedding: EmbeddingConfig,
}

/// 서버 설정
#[derive(Debug, Clone)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
    pub grpc_port: u16, // gRPC server port for backend callbacks
    pub rust_log: String,
    pub log_format: String, // "text" | "json"
    pub allowed_origins: Option<String>,
    pub env: String, // "development" | "staging" | "production"
}

/// 데이터베이스 설정
#[derive(Debug, Clone)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
    pub min_connections: u32,
    pub connect_timeout: Duration,
    pub idle_timeout: Duration,
}

/// 인증 설정 (JWT 관련)
#[derive(Debug, Clone)]
pub struct AuthConfig {
    pub jwt_secret: String,
    pub supabase_url: String,
    pub supabase_anon_key: String,
    pub supabase_service_role_key: String,
}

/// 스토리지 설정 (역할 기반)
#[derive(Debug, Clone)]
pub struct StorageConfig {
    pub endpoint: String,
    pub account_id: String,
    pub access_key_id: String,
    pub secret_access_key: String,
    pub bucket_name: String,
    pub public_url: String,
}

/// 검색 설정 (역할 기반)
#[derive(Debug, Clone)]
pub struct SearchConfig {
    pub url: String,
    pub api_key: String,
}

/// 제휴 서비스 설정 (역할 기반)
#[derive(Debug, Clone)]
pub struct AffiliateConfig {
    pub api_key: String,
    pub publisher_id: String,
}

/// AI 서비스 설정 (gRPC)
#[derive(Debug, Clone)]
pub struct AiServiceConfig {
    pub url: String,
}

/// decoded-agent HTTP 서비스 설정
#[derive(Debug, Clone)]
pub struct AgentServiceConfig {
    pub url: String,
}

/// 임베딩 설정 (Vector Search용 OpenAI Embeddings API)
#[derive(Debug, Clone)]
pub struct EmbeddingConfig {
    pub openai_api_key: String,
    pub model: String,
    pub dimensions: u16,
}

impl AppConfig {
    pub fn from_env() -> Result<Self, Box<dyn std::error::Error>> {
        // 로컬 개발: `.env.dev` 우선, 이어서 `.env` (이미 설정된 변수는 dotenvy가 덮어쓰지 않음)
        let _ = dotenvy::from_filename(".env.dev");
        let _ = dotenvy::dotenv();

        Ok(Self {
            server: ServerConfig {
                host: std::env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
                port: std::env::var("PORT")
                    .unwrap_or_else(|_| "8000".to_string())
                    .parse()?,
                grpc_port: env_primary_or_legacy("API_SERVER_GRPC_PORT", "GRPC_PORT")
                    .unwrap_or_else(|| "50052".to_string())
                    .parse()?,
                rust_log: std::env::var("RUST_LOG").unwrap_or_else(|_| "info".to_string()),
                log_format: {
                    let env = std::env::var("ENV").unwrap_or_else(|_| "development".to_string());
                    // 프로덕션/스테이징은 기본적으로 JSON, 개발은 텍스트
                    let default_format = if env == "production" || env == "staging" {
                        "json"
                    } else {
                        "text"
                    };
                    std::env::var("LOG_FORMAT").unwrap_or_else(|_| default_format.to_string())
                },
                allowed_origins: std::env::var("ALLOWED_ORIGINS").ok(),
                env: std::env::var("ENV").unwrap_or_else(|_| "development".to_string()),
            },
            database: DatabaseConfig {
                url: std::env::var("DATABASE_URL")
                    .expect("DATABASE_URL must be set in environment"),
                max_connections: std::env::var("DB_MAX_CONNECTIONS")
                    .unwrap_or_else(|_| "100".to_string())
                    .parse()?,
                min_connections: std::env::var("DB_MIN_CONNECTIONS")
                    .unwrap_or_else(|_| "5".to_string())
                    .parse()?,
                connect_timeout: Duration::from_secs(
                    std::env::var("DB_CONNECT_TIMEOUT")
                        .unwrap_or_else(|_| "30".to_string())
                        .parse()?,
                ),
                idle_timeout: Duration::from_secs(
                    std::env::var("DB_IDLE_TIMEOUT")
                        .unwrap_or_else(|_| "600".to_string())
                        .parse()?,
                ),
            },
            auth: AuthConfig {
                jwt_secret: std::env::var("SUPABASE_JWT_SECRET")
                    .expect("SUPABASE_JWT_SECRET must be set in environment"),
                supabase_url: std::env::var("SUPABASE_URL")
                    .expect("SUPABASE_URL must be set in environment"),
                supabase_anon_key: std::env::var("SUPABASE_ANON_KEY")
                    .expect("SUPABASE_ANON_KEY must be set in environment"),
                supabase_service_role_key: std::env::var("SUPABASE_SERVICE_ROLE_KEY")
                    .expect("SUPABASE_SERVICE_ROLE_KEY must be set in environment"),
            },
            storage: StorageConfig {
                endpoint: std::env::var("R2_ACCOUNT_ID")
                    .map(|id| format!("https://{}.r2.cloudflarestorage.com", id))
                    .unwrap_or_else(|_| String::new()),
                account_id: std::env::var("R2_ACCOUNT_ID").unwrap_or_else(|_| String::new()),
                access_key_id: std::env::var("R2_ACCESS_KEY_ID").unwrap_or_else(|_| String::new()),
                secret_access_key: std::env::var("R2_SECRET_ACCESS_KEY")
                    .unwrap_or_else(|_| String::new()),
                bucket_name: std::env::var("R2_BUCKET_NAME")
                    .unwrap_or_else(|_| "decoded-images".to_string()),
                public_url: std::env::var("R2_PUBLIC_URL").unwrap_or_else(|_| String::new()),
            },
            search: SearchConfig {
                url: std::env::var("MEILISEARCH_URL")
                    .unwrap_or_else(|_| "http://localhost:7700".to_string()),
                api_key: std::env::var("MEILISEARCH_MASTER_KEY").unwrap_or_else(|_| String::new()),
            },
            affiliate: AffiliateConfig {
                api_key: std::env::var("RAKUTEN_API_KEY").unwrap_or_else(|_| String::new()),
                publisher_id: std::env::var("RAKUTEN_PUBLISHER_ID")
                    .unwrap_or_else(|_| String::new()),
            },
            ai_service: AiServiceConfig {
                url: env_primary_or_legacy("AI_SERVER_GRPC_URL", "DECODED_AI_GRPC_URL")
                    .unwrap_or_else(|| "http://localhost:50051".to_string()),
            },
            agent_service: AgentServiceConfig {
                url: env_primary_or_legacy("AGENT_SERVICE_URL", "DECODED_AGENT_URL")
                    .unwrap_or_else(|| "http://localhost:11000".to_string()),
            },
            embedding: EmbeddingConfig {
                openai_api_key: std::env::var("OPENAI_API_KEY").unwrap_or_else(|_| String::new()),
                model: std::env::var("OPENAI_EMBEDDING_MODEL")
                    .unwrap_or_else(|_| "text-embedding-3-small".to_string()),
                dimensions: std::env::var("OPENAI_EMBEDDING_DIMENSIONS")
                    .unwrap_or_else(|_| "256".to_string())
                    .parse()
                    .unwrap_or(256),
            },
        })
    }

    pub async fn create_db_connection(&self) -> Result<DatabaseConnection, sea_orm::DbErr> {
        let mut opt = ConnectOptions::new(&self.database.url);
        opt.max_connections(self.database.max_connections)
            .min_connections(self.database.min_connections)
            .connect_timeout(self.database.connect_timeout)
            .idle_timeout(self.database.idle_timeout)
            .sqlx_logging(true);

        Database::connect(opt).await
    }
}

/// 애플리케이션 상태
///
/// Trait 기반으로 외부 서비스를 추상화하여 구현체에 종속되지 않도록 합니다.
#[derive(Clone)]
pub struct AppState {
    pub db: Arc<DatabaseConnection>,
    pub config: AppConfig,

    // Category Cache
    pub category_cache: Arc<CategoryCache>,

    // Trait 기반 클라이언트
    pub storage_client: Arc<dyn StorageClient>,
    pub search_client: Arc<dyn SearchClient>,
    pub affiliate_client: Arc<dyn AffiliateClient>,
    pub embedding_client: Arc<dyn EmbeddingClient>,

    // gRPC Client
    pub decoded_ai_client: Arc<DecodedAIGrpcClient>,
}

impl AppState {
    /// 새로운 AppState 생성
    pub async fn new(config: AppConfig) -> Result<Self, sea_orm::DbErr> {
        Self::with_db_connection(config, None).await
    }

    /// DB 연결을 받아서 AppState 생성 (마이그레이션 후 재사용용)
    pub async fn with_db_connection(
        config: AppConfig,
        db: Option<DatabaseConnection>,
    ) -> Result<Self, sea_orm::DbErr> {
        let db = Arc::new(match db {
            Some(conn) => conn,
            None => config.create_db_connection().await?,
        });

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

        // CategoryCache 초기화
        let category_cache = Arc::new(CategoryCache::new());
        tracing::info!("CategoryCache initialized successfully");

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
            config,
            category_cache,
            storage_client,
            search_client,
            affiliate_client,
            embedding_client,
            decoded_ai_client,
        })
    }
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;
    use std::sync::Mutex;

    /// Serializes env-var mutating tests within this module so they don't race.
    static ENV_LOCK: Mutex<()> = Mutex::new(());

    /// Set all required env vars for AppConfig::from_env()
    fn set_required_env() {
        std::env::set_var("DATABASE_URL", "postgres://test:test@localhost/test");
        std::env::set_var("SUPABASE_JWT_SECRET", "test-secret");
        std::env::set_var("SUPABASE_URL", "https://test.supabase.co");
        std::env::set_var("SUPABASE_ANON_KEY", "anon-key");
        std::env::set_var("SUPABASE_SERVICE_ROLE_KEY", "service-key");
    }

    #[test]
    fn from_env_with_required_vars_succeeds() {
        let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        set_required_env();
        let config = AppConfig::from_env();
        assert!(config.is_ok());
    }

    #[test]
    fn default_port_is_8000() {
        let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        set_required_env();
        std::env::remove_var("PORT");
        let config = AppConfig::from_env().expect("config should parse");
        assert_eq!(config.server.port, 8000);
    }

    #[test]
    fn port_override_from_env() {
        let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        set_required_env();
        std::env::set_var("PORT", "9090");
        let config = AppConfig::from_env().expect("config should parse");
        assert_eq!(config.server.port, 9090);
        std::env::remove_var("PORT");
    }

    #[test]
    fn default_log_format_is_text_for_development() {
        let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        set_required_env();
        std::env::remove_var("ENV");
        std::env::remove_var("LOG_FORMAT");
        let config = AppConfig::from_env().expect("config should parse");
        assert_eq!(config.server.log_format, "text");
    }

    #[test]
    fn log_format_json_for_production() {
        let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        set_required_env();
        std::env::set_var("ENV", "production");
        std::env::remove_var("LOG_FORMAT");
        let config = AppConfig::from_env().expect("config should parse");
        assert_eq!(config.server.log_format, "json");
        std::env::remove_var("ENV");
    }

    #[test]
    fn default_database_config_values() {
        let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        set_required_env();
        std::env::remove_var("DB_MAX_CONNECTIONS");
        std::env::remove_var("DB_MIN_CONNECTIONS");
        std::env::remove_var("DB_CONNECT_TIMEOUT");
        std::env::remove_var("DB_IDLE_TIMEOUT");
        let config = AppConfig::from_env().expect("config should parse");
        assert_eq!(config.database.max_connections, 100);
        assert_eq!(config.database.min_connections, 5);
        assert_eq!(config.database.connect_timeout, Duration::from_secs(30));
        assert_eq!(config.database.idle_timeout, Duration::from_secs(600));
    }

    #[test]
    fn default_search_url() {
        let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        set_required_env();
        std::env::remove_var("MEILISEARCH_URL");
        let config = AppConfig::from_env().expect("config should parse");
        assert_eq!(config.search.url, "http://localhost:7700");
    }

    #[test]
    fn default_embedding_config() {
        let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        set_required_env();
        std::env::remove_var("OPENAI_EMBEDDING_MODEL");
        std::env::remove_var("OPENAI_EMBEDDING_DIMENSIONS");
        let config = AppConfig::from_env().expect("config should parse");
        assert_eq!(config.embedding.model, "text-embedding-3-small");
        assert_eq!(config.embedding.dimensions, 256);
    }

    #[test]
    fn env_primary_or_legacy_prefers_primary() {
        let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        std::env::set_var("TEST_PRIMARY_CFG", "primary_val");
        std::env::set_var("TEST_LEGACY_CFG", "legacy_val");
        assert_eq!(
            env_primary_or_legacy("TEST_PRIMARY_CFG", "TEST_LEGACY_CFG"),
            Some("primary_val".to_string())
        );
        std::env::remove_var("TEST_PRIMARY_CFG");
        std::env::remove_var("TEST_LEGACY_CFG");
    }

    #[test]
    fn env_primary_or_legacy_falls_back_to_legacy() {
        std::env::remove_var("TEST_PRIMARY2_CFG");
        std::env::set_var("TEST_LEGACY2_CFG", "legacy_val");
        assert_eq!(
            env_primary_or_legacy("TEST_PRIMARY2_CFG", "TEST_LEGACY2_CFG"),
            Some("legacy_val".to_string())
        );
        std::env::remove_var("TEST_LEGACY2_CFG");
    }

    #[test]
    fn log_format_json_for_staging() {
        let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        set_required_env();
        std::env::set_var("ENV", "staging");
        std::env::remove_var("LOG_FORMAT");
        let config = AppConfig::from_env().expect("config should parse");
        assert_eq!(config.server.log_format, "json");
        std::env::remove_var("ENV");
    }

    #[test]
    fn log_format_explicit_override() {
        let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        set_required_env();
        std::env::set_var("ENV", "production");
        std::env::set_var("LOG_FORMAT", "text");
        let config = AppConfig::from_env().expect("config should parse");
        assert_eq!(config.server.log_format, "text");
        std::env::remove_var("ENV");
        std::env::remove_var("LOG_FORMAT");
    }

    #[test]
    fn default_grpc_port_is_50052() {
        let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        set_required_env();
        std::env::remove_var("API_SERVER_GRPC_PORT");
        std::env::remove_var("GRPC_PORT");
        let config = AppConfig::from_env().expect("config should parse");
        assert_eq!(config.server.grpc_port, 50052);
    }

    #[test]
    fn grpc_port_primary_env_wins() {
        let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        set_required_env();
        std::env::set_var("API_SERVER_GRPC_PORT", "51000");
        std::env::set_var("GRPC_PORT", "52000");
        let config = AppConfig::from_env().expect("config should parse");
        assert_eq!(config.server.grpc_port, 51000);
        std::env::remove_var("API_SERVER_GRPC_PORT");
        std::env::remove_var("GRPC_PORT");
    }

    #[test]
    fn grpc_port_legacy_fallback() {
        let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        set_required_env();
        std::env::remove_var("API_SERVER_GRPC_PORT");
        std::env::set_var("GRPC_PORT", "52000");
        let config = AppConfig::from_env().expect("config should parse");
        assert_eq!(config.server.grpc_port, 52000);
        std::env::remove_var("GRPC_PORT");
    }

    #[test]
    fn default_ai_service_url() {
        let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        set_required_env();
        std::env::remove_var("AI_SERVER_GRPC_URL");
        std::env::remove_var("DECODED_AI_GRPC_URL");
        let config = AppConfig::from_env().expect("config should parse");
        assert_eq!(config.ai_service.url, "http://localhost:50051");
    }

    #[test]
    fn default_agent_service_url() {
        let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        set_required_env();
        std::env::remove_var("AGENT_SERVICE_URL");
        std::env::remove_var("DECODED_AGENT_URL");
        let config = AppConfig::from_env().expect("config should parse");
        assert_eq!(config.agent_service.url, "http://localhost:11000");
    }

    #[test]
    fn storage_endpoint_built_from_r2_account_id() {
        let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        set_required_env();
        std::env::set_var("R2_ACCOUNT_ID", "acc123");
        let config = AppConfig::from_env().expect("config should parse");
        assert_eq!(
            config.storage.endpoint,
            "https://acc123.r2.cloudflarestorage.com"
        );
        assert_eq!(config.storage.account_id, "acc123");
        std::env::remove_var("R2_ACCOUNT_ID");
    }

    #[test]
    fn default_bucket_name_when_unset() {
        let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        set_required_env();
        std::env::remove_var("R2_BUCKET_NAME");
        let config = AppConfig::from_env().expect("config should parse");
        assert_eq!(config.storage.bucket_name, "decoded-images");
    }

    #[test]
    fn db_connect_and_idle_timeout_overrides() {
        let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        set_required_env();
        std::env::set_var("DB_CONNECT_TIMEOUT", "10");
        std::env::set_var("DB_IDLE_TIMEOUT", "120");
        let config = AppConfig::from_env().expect("config should parse");
        assert_eq!(config.database.connect_timeout, Duration::from_secs(10));
        assert_eq!(config.database.idle_timeout, Duration::from_secs(120));
        std::env::remove_var("DB_CONNECT_TIMEOUT");
        std::env::remove_var("DB_IDLE_TIMEOUT");
    }

    #[test]
    fn invalid_port_returns_err() {
        let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        set_required_env();
        std::env::set_var("PORT", "not-a-number");
        let config = AppConfig::from_env();
        assert!(config.is_err());
        std::env::remove_var("PORT");
    }

    #[test]
    fn embedding_dimensions_override() {
        let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        set_required_env();
        std::env::set_var("OPENAI_EMBEDDING_DIMENSIONS", "512");
        let config = AppConfig::from_env().expect("config should parse");
        assert_eq!(config.embedding.dimensions, 512);
        std::env::remove_var("OPENAI_EMBEDDING_DIMENSIONS");
    }

    #[tokio::test]
    async fn create_db_connection_fails_on_invalid_url() {
        let config = {
            let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
            set_required_env();
            std::env::set_var(
                "DATABASE_URL",
                "postgres://bogus:bogus@127.0.0.1:1/none_exist",
            );
            std::env::set_var("DB_CONNECT_TIMEOUT", "1");
            let config = AppConfig::from_env().expect("config should parse");
            std::env::remove_var("DB_CONNECT_TIMEOUT");
            config
        };
        let result = config.create_db_connection().await;
        assert!(result.is_err());
    }

    #[test]
    fn host_override_from_env() {
        let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        set_required_env();
        std::env::set_var("HOST", "10.0.0.1");
        let config = AppConfig::from_env().expect("config should parse");
        assert_eq!(config.server.host, "10.0.0.1");
        std::env::remove_var("HOST");
    }

    #[test]
    fn default_host_is_all_interfaces() {
        let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        set_required_env();
        std::env::remove_var("HOST");
        let config = AppConfig::from_env().expect("config should parse");
        assert_eq!(config.server.host, "0.0.0.0");
    }

    #[test]
    fn allowed_origins_captured_when_set() {
        let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        set_required_env();
        std::env::set_var("ALLOWED_ORIGINS", "https://a.com,https://b.com");
        let config = AppConfig::from_env().expect("config should parse");
        assert_eq!(
            config.server.allowed_origins.as_deref(),
            Some("https://a.com,https://b.com")
        );
        std::env::remove_var("ALLOWED_ORIGINS");
    }

    #[test]
    fn agent_service_legacy_fallback() {
        let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        set_required_env();
        std::env::remove_var("AGENT_SERVICE_URL");
        std::env::set_var("DECODED_AGENT_URL", "http://legacy-agent:11000");
        let config = AppConfig::from_env().expect("config should parse");
        assert_eq!(config.agent_service.url, "http://legacy-agent:11000");
        std::env::remove_var("DECODED_AGENT_URL");
    }

    #[test]
    fn ai_service_legacy_fallback() {
        let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        set_required_env();
        std::env::remove_var("AI_SERVER_GRPC_URL");
        std::env::set_var("DECODED_AI_GRPC_URL", "http://legacy-ai:50051");
        let config = AppConfig::from_env().expect("config should parse");
        assert_eq!(config.ai_service.url, "http://legacy-ai:50051");
        std::env::remove_var("DECODED_AI_GRPC_URL");
    }

    #[test]
    fn embedding_invalid_dimensions_falls_back_to_default() {
        let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        set_required_env();
        std::env::set_var("OPENAI_EMBEDDING_DIMENSIONS", "not-a-number");
        let config = AppConfig::from_env().expect("config should parse");
        // parse().unwrap_or(256) branch
        assert_eq!(config.embedding.dimensions, 256);
        std::env::remove_var("OPENAI_EMBEDDING_DIMENSIONS");
    }

    #[test]
    fn storage_endpoint_empty_when_r2_account_id_missing() {
        let _g = ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        set_required_env();
        std::env::remove_var("R2_ACCOUNT_ID");
        let config = AppConfig::from_env().expect("config should parse");
        assert!(config.storage.endpoint.is_empty());
        assert!(config.storage.account_id.is_empty());
    }

    #[test]
    fn env_primary_or_legacy_returns_none_when_both_missing() {
        std::env::remove_var("MISSING_CFG_A");
        std::env::remove_var("MISSING_CFG_B");
        assert_eq!(
            env_primary_or_legacy("MISSING_CFG_A", "MISSING_CFG_B"),
            None
        );
    }
}
