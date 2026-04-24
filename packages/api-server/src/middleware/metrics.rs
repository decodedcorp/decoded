//! 메트릭 수집 미들웨어
//!
//! 각 HTTP 요청의 경로, 상태 코드, 응답 시간을 MetricsStore에 기록합니다.

use std::time::Instant;

use axum::{extract::Request, middleware::Next, response::Response};

use crate::config::AppState;

/// 요청 메트릭 수집 미들웨어
///
/// axum::middleware::from_fn_with_state 로 등록해야 AppState에 접근 가능합니다.
pub async fn metrics_middleware(
    axum::extract::State(state): axum::extract::State<AppState>,
    request: Request,
    next: Next,
) -> Response {
    let start = Instant::now();
    let path = request.uri().path().to_string();

    let response = next.run(request).await;

    let duration_us = start.elapsed().as_micros() as u64;
    let status = response.status().as_u16();

    state.metrics.record_request(&path, status, duration_us);

    response
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    use super::*;
    use std::sync::Arc;

    use axum::{
        body::Body,
        http::{Request as HttpRequest, StatusCode},
        middleware, routing, Router,
    };
    use sea_orm::{DatabaseBackend, MockDatabase};
    use tower::ServiceExt;

    use crate::{
        config::{
            AffiliateConfig, AgentServiceConfig, AiServiceConfig, AppConfig, AppState, AuthConfig,
            DatabaseConfig, EmbeddingConfig, SearchConfig, ServerConfig, StorageConfig,
        },
        domains::{categories::CategoryCache, posts::cache::PostListCache},
        metrics::MetricsStore,
        services::{
            DecodedAIGrpcClient, DummyAffiliateClient, DummyEmbeddingClient, DummySearchClient,
            DummyStorageClient,
        },
    };

    fn test_state() -> AppState {
        let config = AppConfig {
            server: ServerConfig {
                host: "127.0.0.1".to_string(),
                port: 8000,
                grpc_port: 50052,
                rust_log: "info".to_string(),
                log_format: "text".to_string(),
                allowed_origins: None,
                env: "test".to_string(),
                app_env: crate::config::AppEnv::Local,
            },
            database: DatabaseConfig {
                url: "postgres://localhost/test".to_string(),
                max_connections: 1,
                min_connections: 1,
                connect_timeout: std::time::Duration::from_secs(1),
                idle_timeout: std::time::Duration::from_secs(1),
            },
            assets_database: crate::config::AssetsDatabaseConfig {
                url: "postgres://localhost/test_assets".to_string(),
                max_connections: 1,
                min_connections: 1,
                connect_timeout: std::time::Duration::from_secs(1),
                idle_timeout: std::time::Duration::from_secs(1),
            },
            auth: AuthConfig {
                jwt_secret: "test".to_string(),
                supabase_url: "http://localhost".to_string(),
                supabase_anon_key: "test".to_string(),
                supabase_service_role_key: "test".to_string(),
            },
            storage: StorageConfig {
                endpoint: String::new(),
                account_id: String::new(),
                access_key_id: String::new(),
                secret_access_key: String::new(),
                bucket_name: "test".to_string(),
                public_url: String::new(),
            },
            search: SearchConfig {
                url: "http://localhost:7700".to_string(),
                api_key: String::new(),
            },
            affiliate: AffiliateConfig {
                api_key: String::new(),
                publisher_id: String::new(),
            },
            ai_service: AiServiceConfig {
                url: "http://127.0.0.1:50051".to_string(),
            },
            agent_service: AgentServiceConfig {
                url: "http://127.0.0.1:11000".to_string(),
            },
            embedding: EmbeddingConfig {
                openai_api_key: String::new(),
                model: "text-embedding-3-small".to_string(),
                dimensions: 256,
            },
        };

        let prod_db = Arc::new(MockDatabase::new(DatabaseBackend::Postgres).into_connection());
        let assets_db = Arc::new(MockDatabase::new(DatabaseBackend::Postgres).into_connection());
        AppState {
            db: prod_db,
            assets_db,
            config,
            category_cache: Arc::new(CategoryCache::new()),
            post_list_cache: Arc::new(PostListCache::new()),
            storage_client: Arc::new(DummyStorageClient::default()),
            search_client: Arc::new(DummySearchClient),
            affiliate_client: Arc::new(DummyAffiliateClient),
            embedding_client: Arc::new(DummyEmbeddingClient),
            decoded_ai_client: Arc::new(
                DecodedAIGrpcClient::new("http://127.0.0.1:50051".to_string()).unwrap(),
            ),
            metrics: Arc::new(MetricsStore::new()),
        }
    }

    async fn ok_handler() -> StatusCode {
        StatusCode::OK
    }

    async fn error_handler() -> StatusCode {
        StatusCode::INTERNAL_SERVER_ERROR
    }

    fn build_app(state: AppState, handler: axum::routing::MethodRouter<AppState>) -> Router {
        Router::new()
            .route("/test", handler)
            .layer(middleware::from_fn_with_state(
                state.clone(),
                metrics_middleware,
            ))
            .with_state(state)
    }

    #[tokio::test]
    async fn test_metrics_recorded_on_success() {
        let state = test_state();

        let app = build_app(state.clone(), routing::get(ok_handler));
        let request = HttpRequest::builder()
            .uri("/test")
            .body(Body::empty())
            .unwrap();

        let _ = app.oneshot(request).await.unwrap();

        let snap = state.metrics.snapshot();
        assert_eq!(snap.total_requests, 1);
        assert_eq!(snap.total_errors, 0);
    }

    #[tokio::test]
    async fn test_metrics_recorded_on_error() {
        let state = test_state();

        let app = build_app(state.clone(), routing::get(error_handler));
        let request = HttpRequest::builder()
            .uri("/test")
            .body(Body::empty())
            .unwrap();

        let _ = app.oneshot(request).await.unwrap();

        let snap = state.metrics.snapshot();
        assert_eq!(snap.total_requests, 1);
        assert_eq!(snap.total_errors, 1);
    }
}
