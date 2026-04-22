//! Raw Posts handlers (#258)
//!
//! Admin-gated REST layer for managing scrape sources and browsing
//! collected raw posts. All writes go to `warehouse.raw_post_sources`
//! (sources) or are driven by the ai-server gRPC callback (items).

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    routing::{get, patch, post},
    Json, Router,
};
use serde_json::json;
use uuid::Uuid;

use crate::{
    config::{AppConfig, AppState},
    error::AppResult,
};

use super::{
    dto::{
        CreateRawPostSourceDto, ListItemsQuery, ListSourcesQuery, RawPost, RawPostSource,
        RawPostSourcesPage, RawPostsItemsPage, RawPostsStatsResponse, ReparseResponse,
        SourceMediaOriginalsResponse, UpdateRawPostSourceDto, UpdateSeedStatusDto,
        UpdateSeedStatusResponse,
    },
    service,
};

// --------------------
// sources
// --------------------

#[utoipa::path(
    get,
    path = "/api/v1/raw-posts/sources",
    operation_id = "raw_posts_list_sources",
    tag = "raw-posts",
    security(("bearer_auth" = [])),
    params(
        ("platform" = Option<String>, Query, description = "플랫폼 필터"),
        ("is_active" = Option<bool>, Query, description = "활성 여부"),
        ("limit" = Option<u64>, Query, description = "페이지 사이즈 (default 50, max 500)"),
        ("offset" = Option<u64>, Query, description = "오프셋")
    ),
    responses(
        (status = 200, description = "raw_post_sources 목록", body = RawPostSourcesPage),
        (status = 401),
        (status = 403)
    )
)]
pub async fn list_sources(
    State(state): State<AppState>,
    Query(query): Query<ListSourcesQuery>,
) -> AppResult<Json<RawPostSourcesPage>> {
    let page = service::list_sources(state.db.as_ref(), query).await?;
    Ok(Json(page))
}

#[utoipa::path(
    post,
    path = "/api/v1/raw-posts/sources",
    operation_id = "raw_posts_create_source",
    tag = "raw-posts",
    security(("bearer_auth" = [])),
    request_body = CreateRawPostSourceDto,
    responses(
        (status = 201, description = "생성 성공", body = RawPostSource),
        (status = 400),
        (status = 401),
        (status = 403)
    )
)]
pub async fn create_source(
    State(state): State<AppState>,
    Json(dto): Json<CreateRawPostSourceDto>,
) -> AppResult<(StatusCode, Json<RawPostSource>)> {
    if dto.platform.trim().is_empty()
        || dto.source_type.trim().is_empty()
        || dto.source_identifier.trim().is_empty()
    {
        return Err(crate::error::AppError::BadRequest(
            "platform, source_type, source_identifier are required".into(),
        ));
    }
    if dto.fetch_interval_seconds < 60 {
        return Err(crate::error::AppError::BadRequest(
            "fetch_interval_seconds must be >= 60".into(),
        ));
    }
    let created = service::create_source(state.db.as_ref(), dto).await?;
    Ok((StatusCode::CREATED, Json(created)))
}

#[utoipa::path(
    patch,
    path = "/api/v1/raw-posts/sources/{id}",
    operation_id = "raw_posts_update_source",
    tag = "raw-posts",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "raw_post_source id")),
    request_body = UpdateRawPostSourceDto,
    responses(
        (status = 200, description = "수정 성공", body = RawPostSource),
        (status = 404),
        (status = 401),
        (status = 403)
    )
)]
pub async fn update_source(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(dto): Json<UpdateRawPostSourceDto>,
) -> AppResult<Json<RawPostSource>> {
    let updated = service::update_source(state.db.as_ref(), id, dto).await?;
    Ok(Json(updated))
}

#[utoipa::path(
    delete,
    path = "/api/v1/raw-posts/sources/{id}",
    operation_id = "raw_posts_delete_source",
    tag = "raw-posts",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "raw_post_source id")),
    responses(
        (status = 204, description = "삭제 성공"),
        (status = 404),
        (status = 401),
        (status = 403)
    )
)]
pub async fn delete_source(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> AppResult<StatusCode> {
    service::delete_source(state.db.as_ref(), id).await?;
    Ok(StatusCode::NO_CONTENT)
}

// --------------------
// items
// --------------------

#[utoipa::path(
    get,
    path = "/api/v1/raw-posts/items",
    operation_id = "raw_posts_list_items",
    tag = "raw-posts",
    security(("bearer_auth" = [])),
    params(
        ("platform" = Option<String>, Query, description = "플랫폼 필터"),
        ("parse_status" = Option<String>, Query, description = "parse_status 필터 (pending/parsed/failed/skipped)"),
        ("source_id" = Option<Uuid>, Query, description = "raw_post_source id 필터"),
        ("limit" = Option<u64>, Query),
        ("offset" = Option<u64>, Query),
    ),
    responses(
        (status = 200, description = "raw_posts 목록", body = RawPostsItemsPage),
        (status = 401),
        (status = 403)
    )
)]
pub async fn list_items(
    State(state): State<AppState>,
    Query(query): Query<ListItemsQuery>,
) -> AppResult<Json<RawPostsItemsPage>> {
    let page = service::list_items(state.db.as_ref(), query).await?;
    Ok(Json(page))
}

#[utoipa::path(
    get,
    path = "/api/v1/raw-posts/items/{id}",
    operation_id = "raw_posts_get_item",
    tag = "raw-posts",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "raw_post id")),
    responses(
        (status = 200, description = "단일 raw_post", body = RawPost),
        (status = 404),
        (status = 401),
        (status = 403)
    )
)]
pub async fn get_item(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<RawPost>> {
    let item = service::get_item(state.db.as_ref(), id).await?;
    Ok(Json(item))
}

// --------------------
// originals (#261)
// --------------------

#[utoipa::path(
    get,
    path = "/api/v1/raw-posts/items/{id}/originals",
    operation_id = "raw_posts_list_originals",
    tag = "raw-posts",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "raw_post id")),
    responses(
        (status = 200, description = "원본 후보 목록", body = SourceMediaOriginalsResponse),
        (status = 401),
        (status = 403)
    )
)]
pub async fn list_originals(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<SourceMediaOriginalsResponse>> {
    let items = service::list_originals(state.db.as_ref(), id).await?;
    Ok(Json(SourceMediaOriginalsResponse { items }))
}

// --------------------
// reparse (proxy to ai-server, #260)
// --------------------

#[utoipa::path(
    post,
    path = "/api/v1/raw-posts/items/{id}/reparse",
    operation_id = "raw_posts_reparse_item",
    tag = "raw-posts",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "raw_post id")),
    responses(
        (status = 200, description = "ai-server 재파싱 트리거 결과", body = ReparseResponse),
        (status = 404),
        (status = 502, description = "ai-server 통신 실패"),
        (status = 401),
        (status = 403)
    )
)]
pub async fn reparse_item(
    State(_state): State<AppState>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<ReparseResponse>> {
    // Best-effort proxy to ai-server's FastAPI endpoint.
    let base = std::env::var("AI_SERVER_HTTP_URL")
        .unwrap_or_else(|_| "http://localhost:10000".to_string());
    let url = format!("{}/media/items/{}/reparse", base.trim_end_matches('/'), id);
    let client = reqwest::Client::new();
    let resp = client
        .post(&url)
        .timeout(std::time::Duration::from_secs(60))
        .send()
        .await
        .map_err(|e| {
            tracing::error!("reparse proxy failed: {}", e);
            crate::error::AppError::ExternalService(format!("ai-server unreachable: {e}"))
        })?;
    let status = resp.status();
    if !status.is_success() {
        let body = resp.text().await.unwrap_or_default();
        return Err(crate::error::AppError::ExternalService(format!(
            "ai-server responded {status}: {body}"
        )));
    }
    let payload: serde_json::Value = resp.json().await.map_err(|e| {
        crate::error::AppError::ExternalService(format!("invalid ai-server response: {e}"))
    })?;
    let triggered = payload
        .get("triggered")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    let final_status = payload
        .get("status")
        .and_then(|v| v.as_str())
        .unwrap_or("unknown")
        .to_string();
    // echo a minimal shape back so the UI can just read it.
    let _ = json!({}); // silence "unused import" lint
    Ok(Json(ReparseResponse {
        triggered,
        raw_post_id: id,
        status: final_status,
    }))
}

// --------------------
// seed status transition (#289)
// --------------------

#[utoipa::path(
    patch,
    path = "/api/v1/raw-posts/items/{id}/seed-status",
    operation_id = "raw_posts_update_seed_status",
    tag = "raw-posts",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "raw_post id")),
    request_body = UpdateSeedStatusDto,
    responses(
        (status = 200, description = "seed_posts.status 전환", body = UpdateSeedStatusResponse),
        (status = 400, description = "아직 seed_post 없음 or 잘못된 status"),
        (status = 404),
        (status = 401),
        (status = 403)
    )
)]
pub async fn update_seed_status(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(dto): Json<UpdateSeedStatusDto>,
) -> AppResult<Json<UpdateSeedStatusResponse>> {
    // Lightweight allowlist validation (the validator derive runs only if we
    // plumb it through ValidatedJson; keep this inline for explicitness).
    match dto.status.as_str() {
        "draft" | "approved" | "rejected" => {}
        other => {
            return Err(crate::error::AppError::BadRequest(format!(
                "invalid seed status: {other}"
            )))
        }
    }
    let (seed_post_id, new_status) =
        service::update_seed_status(state.db.as_ref(), id, &dto.status).await?;
    Ok(Json(UpdateSeedStatusResponse {
        raw_post_id: id,
        seed_post_id,
        status: new_status,
    }))
}

// --------------------
// stats
// --------------------

#[utoipa::path(
    get,
    path = "/api/v1/raw-posts/stats",
    operation_id = "raw_posts_stats",
    tag = "raw-posts",
    security(("bearer_auth" = [])),
    responses(
        (status = 200, description = "플랫폼별 parse_status 카운트", body = RawPostsStatsResponse),
        (status = 401),
        (status = 403)
    )
)]
pub async fn stats(State(state): State<AppState>) -> AppResult<Json<RawPostsStatsResponse>> {
    let entries = service::stats(state.db.as_ref()).await?;
    Ok(Json(RawPostsStatsResponse { entries }))
}

// --------------------
// router
// --------------------

pub fn router(app_config: AppConfig) -> Router<AppState> {
    Router::new()
        .route("/sources", get(list_sources).post(create_source))
        .route("/sources/{id}", patch(update_source).delete(delete_source))
        .route("/items", get(list_items))
        .route("/items/{id}", get(get_item))
        .route("/items/{id}/originals", get(list_originals))
        .route("/items/{id}/reparse", post(reparse_item))
        .route("/items/{id}/seed-status", patch(update_seed_status))
        .route("/stats", get(stats))
        .layer(axum::middleware::from_fn_with_state(
            app_config.clone(),
            crate::middleware::auth_middleware,
        ))
        .layer(axum::middleware::from_fn(
            crate::middleware::admin_middleware,
        ))
}
