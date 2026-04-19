use decoded_api::{
    batch, handlers, middleware, openapi, router, AppConfig, AppState, IndexConfig,
    MeilisearchClient,
};
use migration::{Migrator, MigratorTrait};
use std::sync::Arc;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Sentry는 tokio 런타임 시작 전에 초기화해야 한다 (_guard는 async_main 종료 후에도 살아있어야 함)
    let _guard = sentry::init((
        std::env::var("SENTRY_DSN").unwrap_or_default(),
        sentry::ClientOptions {
            release: sentry::release_name!(),
            environment: Some(
                std::env::var("APP_ENV")
                    .unwrap_or_else(|_| "development".into())
                    .into(),
            ),
            traces_sample_rate: if cfg!(debug_assertions) { 1.0 } else { 0.1 },
            ..Default::default()
        },
    ));

    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()?
        .block_on(async_main())
}

async fn async_main() -> Result<(), Box<dyn std::error::Error>> {
    // 환경 변수 및 설정 로드
    let config = AppConfig::from_env()?;

    // Tracing 초기화
    let env_filter = tracing_subscriber::EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| config.server.rust_log.clone().into());

    // 로그 포맷 설정 (JSON 또는 텍스트)
    if config.server.log_format == "json" {
        tracing_subscriber::registry()
            .with(env_filter)
            .with(
                tracing_subscriber::fmt::layer()
                    .json()
                    .with_target(false)
                    .with_file(false)
                    .with_line_number(false),
            )
            .with(sentry::integrations::tracing::layer().event_filter(|md| {
                use sentry::integrations::tracing::EventFilter;
                match *md.level() {
                    tracing::Level::ERROR => EventFilter::Event,
                    tracing::Level::WARN => EventFilter::Breadcrumb,
                    _ => EventFilter::Ignore,
                }
            }))
            .init();
    } else {
        tracing_subscriber::registry()
            .with(env_filter)
            .with(tracing_subscriber::fmt::layer())
            .with(sentry::integrations::tracing::layer().event_filter(|md| {
                use sentry::integrations::tracing::EventFilter;
                match *md.level() {
                    tracing::Level::ERROR => EventFilter::Event,
                    tracing::Level::WARN => EventFilter::Breadcrumb,
                    _ => EventFilter::Ignore,
                }
            }))
            .init();
    }

    tracing::info!("Starting DECODED API server");
    tracing::info!("Environment: {}", config.server.rust_log);

    // DB 연결 (마이그레이션용)
    let db_connection = config.create_db_connection().await?;
    tracing::info!("Database connection established");

    // 데이터베이스 마이그레이션 자동 실행
    tracing::info!("Running database migrations...");
    if let Err(e) = Migrator::up(&db_connection, None).await {
        tracing::error!("Failed to run migrations: {}", e);
        return Err(format!("Migration failed: {}", e).into());
    }
    tracing::info!("Database migrations completed successfully");

    // AppState 생성 (마이그레이션용 연결 재사용)
    let state = AppState::with_db_connection(config.clone(), Some(db_connection)).await?;

    // Meilisearch 인덱스 초기화
    tracing::info!("Setting up Meilisearch indexes...");
    if let Some(meilisearch_client) = state
        .search_client
        .as_any()
        .downcast_ref::<MeilisearchClient>()
    {
        let index_config = IndexConfig::new(meilisearch_client.get_client().clone());
        match index_config.setup_all_indexes().await {
            Ok(_) => tracing::info!("Meilisearch indexes setup completed"),
            Err(e) => tracing::warn!(
                "Failed to setup Meilisearch indexes: {}. Search may not work properly.",
                e
            ),
        }
    } else {
        tracing::warn!("Search client is not MeilisearchClient, skipping index setup");
    }

    // 배치 스케줄러 시작
    let scheduler_state = Arc::new(state.clone());
    tokio::spawn(async move {
        if let Err(e) = batch::start_scheduler(scheduler_state).await {
            tracing::error!("Failed to start batch scheduler: {}", e);
        }
    });

    // gRPC 서버 시작 (Backend callback용)
    let grpc_state = Arc::new(state.clone());
    let grpc_addr = format!("{}:{}", config.server.host, config.server.grpc_port);
    let grpc_addr_clone = grpc_addr.clone();
    tokio::spawn(async move {
        use decoded_api::grpc::outbound::metadata_server::MetadataServer;
        use decoded_api::grpc::outbound::raw_posts_callback_server::RawPostsCallbackServer;
        use decoded_api::services::backend_grpc::BackendGrpcService;
        use decoded_api::services::raw_posts_callback::RawPostsCallbackService;
        use tonic::transport::Server;

        let backend_service =
            BackendGrpcService::new(grpc_state.db.clone(), grpc_state.embedding_client.clone());
        let metadata_server = MetadataServer::new(backend_service);

        // #258 Raw posts callback — receives results after ai-server scrape
        let raw_posts_callback_service = RawPostsCallbackService::new(grpc_state.db.clone());
        let raw_posts_callback_server = RawPostsCallbackServer::new(raw_posts_callback_service);

        match Server::builder()
            .add_service(metadata_server)
            .add_service(raw_posts_callback_server)
            .serve(grpc_addr_clone.parse().expect("Invalid gRPC address"))
            .await
        {
            Ok(_) => tracing::info!("gRPC server shutdown"),
            Err(e) => tracing::error!("gRPC server error: {}", e),
        }
    });
    tracing::info!("gRPC server starting on {}", grpc_addr);

    // 서버 주소 설정
    let addr = format!("{}:{}", config.server.host, config.server.port);

    // API 라우터 구성
    let api_router = router::build_api_router(state.clone());

    let app = axum::Router::new()
        .route("/health", axum::routing::get(handlers::health_check))
        .nest("/api/v1", api_router)
        .merge(
            SwaggerUi::new("/swagger-ui").url("/api-docs/openapi.json", openapi::ApiDoc::openapi()),
        )
        .layer(sentry::integrations::tower::NewSentryLayer::<
            axum::extract::Request,
        >::new_from_top())
        .layer(sentry::integrations::tower::SentryHttpLayer::new().enable_transaction())
        .layer(axum::middleware::from_fn_with_state(
            state.clone(),
            middleware::metrics_middleware,
        ))
        .layer(axum::middleware::from_fn(
            middleware::request_logger_middleware,
        ))
        .layer(middleware::create_cors_layer(
            middleware::parse_allowed_origins(config.server.allowed_origins.clone()),
            &config.server.env,
        ))
        .with_state(state);

    // 서버 시작
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!("Server listening on {}", addr);

    // Graceful shutdown을 위한 signal 처리
    let shutdown_signal = async {
        let ctrl_c = async {
            tokio::signal::ctrl_c()
                .await
                .expect("failed to install Ctrl+C handler");
        };

        #[cfg(unix)]
        let terminate = async {
            tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
                .expect("failed to install signal handler")
                .recv()
                .await;
        };

        #[cfg(not(unix))]
        let terminate = std::future::pending::<()>();

        tokio::select! {
            _ = ctrl_c => {},
            _ = terminate => {},
        }

        tracing::info!("Shutdown signal received, starting graceful shutdown...");
    };

    // 서버 실행 (graceful shutdown 지원)
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal)
        .await?;

    tracing::info!("Server shutdown complete");
    Ok(())
}
