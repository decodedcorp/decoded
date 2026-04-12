//! Feed 핸들러
//!
//! 피드 API 엔드포인트 핸들러

use axum::{
    extract::{Path, Query, State},
    response::IntoResponse,
    routing::get,
    Extension, Json, Router,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    config::{AppConfig, AppState},
    error::AppResult,
    middleware::auth::User,
    utils::pagination::Pagination,
};

use super::{
    dto::{
        CurationDetailResponse, CurationListResponse, EditorPicksResponse, FeedResponse,
        TrendingResponse,
    },
    service::FeedService,
};

#[derive(Debug, Deserialize)]
pub struct EditorPicksQuery {
    /// 반환할 post 개수 (기본 8, 상한 50)
    pub limit: Option<u64>,
}

/// 홈 피드 조회
#[utoipa::path(
    get,
    path = "/api/v1/feed",
    params(
        ("page" = Option<u64>, Query, description = "페이지 번호 (default: 1)"),
        ("per_page" = Option<u64>, Query, description = "페이지당 개수 (default: 20, max: 100)")
    ),
    responses(
        (status = 200, description = "피드 조회 성공", body = FeedResponse),
    ),
    tag = "feed"
)]
pub async fn home_feed(
    State(state): State<AppState>,
    Query(pagination): Query<Pagination>,
    user: Option<Extension<User>>,
) -> AppResult<impl IntoResponse> {
    let user_id = user.map(|Extension(u)| u.id);
    let result = FeedService::home_feed(&state, user_id, pagination).await?;
    Ok(Json(result))
}

/// 트렌딩 조회
#[utoipa::path(
    get,
    path = "/api/v1/feed/trending",
    params(
        ("page" = Option<u64>, Query, description = "페이지 번호 (default: 1)"),
        ("per_page" = Option<u64>, Query, description = "페이지당 개수 (default: 20, max: 100)")
    ),
    responses(
        (status = 200, description = "트렌딩 조회 성공", body = TrendingResponse),
    ),
    tag = "feed"
)]
pub async fn trending(
    State(state): State<AppState>,
    Query(pagination): Query<Pagination>,
) -> AppResult<impl IntoResponse> {
    let result = FeedService::trending(&state, pagination).await?;
    Ok(Json(result))
}

/// 큐레이션 목록 조회
#[utoipa::path(
    get,
    path = "/api/v1/feed/curations",
    responses(
        (status = 200, description = "큐레이션 목록 조회 성공", body = CurationListResponse),
    ),
    tag = "feed"
)]
pub async fn list_curations(State(state): State<AppState>) -> AppResult<impl IntoResponse> {
    let result = FeedService::list_curations(&state).await?;
    Ok(Json(result))
}

/// 큐레이션 상세 조회
#[utoipa::path(
    get,
    path = "/api/v1/feed/curations/{curation_id}",
    params(
        ("curation_id" = Uuid, Path, description = "큐레이션 ID")
    ),
    responses(
        (status = 200, description = "큐레이션 상세 조회 성공", body = CurationDetailResponse),
        (status = 404, description = "큐레이션을 찾을 수 없음"),
    ),
    tag = "feed"
)]
pub async fn curation_detail(
    State(state): State<AppState>,
    Path(curation_id): Path<Uuid>,
) -> AppResult<impl IntoResponse> {
    let result = FeedService::curation_detail(&state, curation_id).await?;
    Ok(Json(result))
}

/// 에디터 픽 조회
#[utoipa::path(
    get,
    path = "/api/v1/feed/editor-picks",
    params(
        ("limit" = Option<u64>, Query, description = "반환할 post 개수 (default 8, max 50)")
    ),
    responses(
        (status = 200, description = "에디터 픽 조회 성공", body = EditorPicksResponse),
    ),
    tag = "feed"
)]
pub async fn editor_picks(
    State(state): State<AppState>,
    Query(q): Query<EditorPicksQuery>,
) -> AppResult<impl IntoResponse> {
    let limit = q.limit.unwrap_or(8).clamp(1, 50);
    let result = FeedService::editor_picks(&state, limit).await?;
    Ok(Json(result))
}

/// Feed 라우터
pub fn router(config: AppConfig) -> Router<AppState> {
    Router::new()
        .route("/", get(home_feed))
        .route("/trending", get(trending))
        .route("/curations", get(list_curations))
        .route("/curations/{curation_id}", get(curation_detail))
        .route("/editor-picks", get(editor_picks))
        .layer(axum::middleware::from_fn_with_state(
            config.clone(),
            crate::middleware::auth::optional_auth_middleware,
        ))
}
