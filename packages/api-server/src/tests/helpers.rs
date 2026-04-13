//! 테스트 헬퍼 — **라이브러리 단위 테스트용**.
//!
//! SeaORM `MockDatabase`를 사용하여 DB 의존 서비스 로직도 단위 테스트 가능.
//! `AppState.db`를 `Arc<DatabaseConnection>`으로 래핑하여 mock feature 호환.

use axum::Router;
use sea_orm::{DatabaseBackend, DatabaseConnection, MockDatabase, MockExecResult};
use std::sync::Arc;
use uuid::Uuid;

use crate::config::{
    AffiliateConfig, AgentServiceConfig, AiServiceConfig, AppConfig, AppState, AuthConfig,
    DatabaseConfig, EmbeddingConfig, SearchConfig, ServerConfig, StorageConfig,
};
use crate::domains::categories::CategoryCache;
use crate::middleware::auth::User;
use crate::services::{
    AffiliateClient, DecodedAIGrpcClient, DummyAffiliateClient, DummyEmbeddingClient,
    DummySearchClient, DummyStorageClient, EmbeddingClient, SearchClient, StorageClient,
};

/// 최소한의 라우터 (헬스 등 스모크용)
pub fn create_test_app() -> Router {
    Router::new().route("/health", axum::routing::get(|| async { "OK" }))
}

/// 테스트용 AppConfig (환경변수 불필요)
pub fn test_config() -> AppConfig {
    AppConfig {
        server: ServerConfig {
            host: "127.0.0.1".to_string(),
            port: 8000,
            grpc_port: 50052,
            rust_log: "info".to_string(),
            log_format: "text".to_string(),
            allowed_origins: None,
            env: "test".to_string(),
        },
        database: DatabaseConfig {
            url: "postgres://test:test@localhost:5432/test".to_string(),
            max_connections: 5,
            min_connections: 1,
            connect_timeout: std::time::Duration::from_secs(5),
            idle_timeout: std::time::Duration::from_secs(60),
        },
        auth: AuthConfig {
            jwt_secret: "test-jwt-secret-key-at-least-32-chars!!".to_string(),
            supabase_url: "https://test.supabase.co".to_string(),
            supabase_anon_key: "test-anon-key".to_string(),
            supabase_service_role_key: "test-service-role-key".to_string(),
        },
        storage: StorageConfig {
            endpoint: "https://test.r2.cloudflarestorage.com".to_string(),
            account_id: "test-account".to_string(),
            access_key_id: "test-key".to_string(),
            secret_access_key: "test-secret".to_string(),
            bucket_name: "test-bucket".to_string(),
            public_url: "https://cdn.test.com".to_string(),
        },
        search: SearchConfig {
            url: "http://localhost:7700".to_string(),
            api_key: "test-master-key".to_string(),
        },
        affiliate: AffiliateConfig {
            api_key: "test-affiliate-key".to_string(),
            publisher_id: "test-publisher".to_string(),
        },
        ai_service: AiServiceConfig {
            url: "http://localhost:50051".to_string(),
        },
        agent_service: AgentServiceConfig {
            url: "http://localhost:11000".to_string(),
        },
        embedding: EmbeddingConfig {
            openai_api_key: "test-openai-key".to_string(),
            model: "text-embedding-3-small".to_string(),
            dimensions: 256,
        },
    }
}

/// 빈 MockDatabase (쿼리 결과 없음)
pub fn empty_mock_db() -> DatabaseConnection {
    MockDatabase::new(DatabaseBackend::Postgres).into_connection()
}

/// 쿼리 결과가 포함된 MockDatabase 빌더
pub fn mock_db_with_query_results<M>(results: Vec<Vec<M>>) -> DatabaseConnection
where
    M: sea_orm::IntoMockRow,
{
    let mut db = MockDatabase::new(DatabaseBackend::Postgres);
    for rows in results {
        db = db.append_query_results([rows]);
    }
    db.into_connection()
}

/// 쿼리 결과 + exec 결과 (INSERT/UPDATE/DELETE)
pub fn mock_db_with_results<M>(
    query_results: Vec<Vec<M>>,
    exec_results: Vec<MockExecResult>,
) -> DatabaseConnection
where
    M: sea_orm::IntoMockRow,
{
    let mut db = MockDatabase::new(DatabaseBackend::Postgres);
    for rows in query_results {
        db = db.append_query_results([rows]);
    }
    for exec in exec_results {
        db = db.append_exec_results([exec]);
    }
    db.into_connection()
}

/// 테스트용 AppState (MockDatabase 또는 실 DB 연결 모두 가능)
pub fn test_app_state(db: DatabaseConnection) -> AppState {
    let db = Arc::new(db);
    test_app_state_with_clients(
        db,
        Arc::new(DummyStorageClient::default()),
        Arc::new(DummySearchClient),
        Arc::new(DummyAffiliateClient),
        Arc::new(DummyEmbeddingClient),
    )
}

/// 커스텀 trait 클라이언트를 주입할 수 있는 AppState
pub fn test_app_state_with_clients(
    db: Arc<sea_orm::DatabaseConnection>,
    storage_client: Arc<dyn StorageClient>,
    search_client: Arc<dyn SearchClient>,
    affiliate_client: Arc<dyn AffiliateClient>,
    embedding_client: Arc<dyn EmbeddingClient>,
) -> AppState {
    let decoded_ai_client = DecodedAIGrpcClient::new("http://localhost:50051".to_string()).unwrap();

    AppState {
        db,
        config: test_config(),
        category_cache: Arc::new(CategoryCache::new()),
        post_list_cache: Arc::new(crate::domains::posts::cache::PostListCache::new()),
        storage_client,
        search_client,
        affiliate_client,
        embedding_client,
        decoded_ai_client: Arc::new(decoded_ai_client),
        metrics: Arc::new(crate::metrics::MetricsStore::new()),
    }
}

/// 테스트용 일반 사용자
pub fn mock_user() -> User {
    User {
        id: super::fixtures::test_uuid(10),
        email: "test@example.com".to_string(),
        username: Some("testuser".to_string()),
        rank: "user".to_string(),
        is_admin: false,
    }
}

/// 테스트용 관리자 사용자
pub fn mock_admin_user() -> User {
    User {
        id: super::fixtures::test_uuid(99),
        email: "admin@example.com".to_string(),
        username: Some("admin".to_string()),
        rank: "admin".to_string(),
        is_admin: true,
    }
}

/// 특정 ID의 사용자 생성
pub fn mock_user_with_id(id: Uuid) -> User {
    User {
        id,
        email: format!("user-{}@example.com", id),
        username: Some(format!("user-{}", &id.to_string()[..8])),
        rank: "user".to_string(),
        is_admin: false,
    }
}

#[cfg(test)]
mod tests {
    use super::create_test_app;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use tower::ServiceExt;

    #[tokio::test]
    async fn create_test_app_health_ok() {
        let app = create_test_app();
        let res = app
            .oneshot(
                Request::builder()
                    .uri("/health")
                    .body(Body::empty())
                    .expect("request"),
            )
            .await
            .expect("response");
        assert_eq!(res.status(), StatusCode::OK);
    }

    #[test]
    fn test_config_creates_successfully() {
        let config = super::test_config();
        assert_eq!(config.server.env, "test");
        assert_eq!(config.server.port, 8000);
    }

    #[test]
    fn mock_user_has_correct_defaults() {
        let user = super::mock_user();
        assert!(!user.is_admin);
        assert_eq!(user.rank, "user");
    }

    #[tokio::test]
    async fn mock_db_returns_query_results() {
        use crate::tests::fixtures::post_model;
        use sea_orm::EntityTrait;

        let db = super::mock_db_with_query_results(vec![vec![post_model()]]);
        let result =
            crate::entities::posts::Entity::find_by_id(crate::tests::fixtures::test_uuid(1))
                .one(&db)
                .await
                .unwrap();
        assert!(result.is_some());
        assert_eq!(result.unwrap().id, crate::tests::fixtures::test_uuid(1));
    }

    #[tokio::test]
    async fn mock_db_empty_returns_none() {
        use sea_orm::EntityTrait;
        let db = super::mock_db_with_query_results::<crate::entities::posts::Model>(vec![vec![]]);
        let result = crate::entities::posts::Entity::find_by_id(uuid::Uuid::nil())
            .one(&db)
            .await
            .unwrap();
        assert!(result.is_none());
    }

    #[tokio::test]
    async fn test_app_state_with_mock_db() {
        let db = super::empty_mock_db();
        let state = super::test_app_state(db);
        assert_eq!(state.config.server.env, "test");
    }

    #[test]
    fn mock_admin_user_has_admin_flag() {
        let admin = super::mock_admin_user();
        assert!(admin.is_admin);
        assert_eq!(admin.rank, "admin");
    }
}
