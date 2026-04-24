//! Raw Posts handlers (#258)
//!
//! Admin-gated REST layer for managing scrape sources and browsing
//! collected raw posts. All writes go to `public.raw_post_sources`
//! (sources) or are driven by the ai-server gRPC callback (items).

use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    routing::{get, patch, post},
    Json, Router,
};
use uuid::Uuid;

use crate::{
    config::{AppConfig, AppState},
    error::AppResult,
    middleware::User,
};

use super::{
    dto::{
        CreateRawPostSourceDto, ListItemsQuery, ListSourcesQuery, RawPost, RawPostSource,
        RawPostSourcesPage, RawPostsItemsPage, RawPostsStatsResponse, UpdateRawPostSourceDto,
        VerifyRawPostDto,
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
    let page = service::list_sources(state.assets_db.as_ref(), query).await?;
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
    let created = service::create_source(state.assets_db.as_ref(), dto).await?;
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
    let updated = service::update_source(state.assets_db.as_ref(), id, dto).await?;
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
    service::delete_source(state.assets_db.as_ref(), id).await?;
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
    let page = service::list_items(state.assets_db.as_ref(), query).await?;
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
    let item = service::get_item(state.assets_db.as_ref(), id).await?;
    Ok(Json(item))
}

// --------------------
// verify (#333)
// --------------------

#[utoipa::path(
    post,
    path = "/api/v1/raw-posts/{id}/verify",
    operation_id = "raw_posts_verify",
    tag = "raw-posts",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "검증할 raw_post id")),
    request_body = VerifyRawPostDto,
    responses(
        (status = 200, description = "검증 완료 → prod.posts INSERT", body = crate::domains::posts::dto::PostResponse),
        (status = 400, description = "raw_post 가 COMPLETED 상태가 아님"),
        (status = 404, description = "raw_post 없음"),
        (status = 401),
        (status = 403)
    )
)]
pub async fn verify(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
    Json(dto): Json<VerifyRawPostDto>,
) -> AppResult<Json<crate::domains::posts::dto::PostResponse>> {
    let resp = service::verify_raw_post(&state, id, user.id, dto).await?;
    Ok(Json(resp))
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
    let entries = service::stats(state.assets_db.as_ref()).await?;
    Ok(Json(RawPostsStatsResponse { entries }))
}

// --------------------
// router
// --------------------

pub fn router(state: AppState, app_config: AppConfig) -> Router<AppState> {
    Router::new()
        .route("/sources", get(list_sources).post(create_source))
        .route("/sources/{id}", patch(update_source).delete(delete_source))
        .route("/items", get(list_items))
        .route("/items/{id}", get(get_item))
        .route("/items/{id}/verify", post(verify))
        .route("/stats", get(stats))
        // Layer order matters: last .layer() is outermost → runs first.
        // admin_db_middleware reads the User extension that auth_middleware
        // injects, so auth MUST be outer (added last). The previous order
        // made every raw-posts admin request fail with 401
        // "Authentication required" — same trap documented in #257.
        //
        // Use `admin_db_middleware` (DB `users.is_admin`), not the JWT-role
        // variant: Supabase signs `role=authenticated` for normal sessions
        // so the JWT check would always 403. Other admin routes (dashboard,
        // editorial_candidates, magazine_sessions) use the `_db` variant
        // for the same reason.
        .layer(axum::middleware::from_fn_with_state(
            state,
            crate::middleware::admin_db_middleware,
        ))
        .layer(axum::middleware::from_fn_with_state(
            app_config,
            crate::middleware::auth_middleware,
        ))
}
