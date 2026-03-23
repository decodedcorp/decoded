//! Search 핸들러
//!
//! 검색 API 엔드포인트 핸들러

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Extension, Json, Router,
};
use uuid::Uuid;

use crate::{
    config::{AppConfig, AppState},
    error::AppResult,
    middleware::auth::User,
};

use super::{
    dto::{
        PopularSearchResponse, RecentSearchResponse, SearchQuery, SearchResponse,
        SimilarSearchQuery, SimilarSearchResponse,
    },
    service::SearchService,
};

/// 통합 검색
#[utoipa::path(
    get,
    path = "/api/v1/search",
    params(SearchQuery),
    responses(
        (status = 200, description = "검색 성공", body = SearchResponse),
        (status = 400, description = "잘못된 요청"),
    ),
    tag = "search"
)]
pub async fn search(
    State(state): State<AppState>,
    Query(query): Query<SearchQuery>,
    user: Option<Extension<User>>,
) -> AppResult<impl IntoResponse> {
    let user_id = user.map(|Extension(u)| u.id);
    let result = SearchService::search(&state, user_id, query).await?;
    Ok(Json(result))
}

/// 인기 검색어 조회
#[utoipa::path(
    get,
    path = "/api/v1/search/popular",
    responses(
        (status = 200, description = "인기 검색어 조회 성공", body = PopularSearchResponse),
    ),
    tag = "search"
)]
pub async fn popular_searches(State(state): State<AppState>) -> AppResult<impl IntoResponse> {
    let result = SearchService::popular_searches(&state).await?;
    Ok(Json(result))
}

/// 최근 검색어 조회
#[utoipa::path(
    get,
    path = "/api/v1/search/recent",
    params(
        ("limit" = Option<u32>, Query, description = "조회 개수 (max: 20)")
    ),
    responses(
        (status = 200, description = "최근 검색어 조회 성공", body = RecentSearchResponse),
        (status = 401, description = "인증 필요"),
    ),
    security(
        ("bearer" = [])
    ),
    tag = "search"
)]
pub async fn recent_searches(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Query(params): Query<RecentSearchQuery>,
) -> AppResult<impl IntoResponse> {
    let limit = params.limit.unwrap_or(10);
    let result = SearchService::recent_searches(&state, user.id, limit).await?;
    Ok(Json(result))
}

/// 최근 검색어 삭제
#[utoipa::path(
    delete,
    path = "/api/v1/search/recent/{id}",
    params(
        ("id" = Uuid, Path, description = "검색 로그 ID")
    ),
    responses(
        (status = 204, description = "삭제 성공"),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "권한 없음"),
        (status = 404, description = "검색 로그를 찾을 수 없음"),
    ),
    security(
        ("bearer" = [])
    ),
    tag = "search"
)]
pub async fn delete_recent_search(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Path(id): Path<Uuid>,
) -> AppResult<impl IntoResponse> {
    SearchService::delete_recent_search(&state, user.id, id).await?;
    Ok(StatusCode::NO_CONTENT)
}

/// 최근 검색어 쿼리 파라미터
#[derive(Debug, serde::Deserialize)]
pub struct RecentSearchQuery {
    pub limit: Option<u32>,
}

/// 시멘틱 유사도 검색
#[utoipa::path(
    get,
    path = "/api/v1/search/similar",
    params(SimilarSearchQuery),
    responses(
        (status = 200, description = "검색 성공", body = SimilarSearchResponse),
        (status = 400, description = "잘못된 요청"),
    ),
    tag = "search"
)]
pub async fn search_similar(
    State(state): State<AppState>,
    Query(query): Query<SimilarSearchQuery>,
) -> AppResult<impl IntoResponse> {
    let result = SearchService::search_similar(&state, query).await?;
    Ok(Json(result))
}

/// Search 라우터
pub fn router(config: AppConfig) -> Router<AppState> {
    Router::new()
        .route("/", get(search))
        .route("/similar", get(search_similar))
        .route("/popular", get(popular_searches))
        .route("/recent", get(recent_searches))
        .route("/recent/{id}", axum::routing::delete(delete_recent_search))
        .layer(axum::middleware::from_fn_with_state(
            config.clone(),
            crate::middleware::auth::optional_auth_middleware,
        ))
}
