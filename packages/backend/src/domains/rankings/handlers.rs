//! Rankings 도메인 핸들러
//!
//! HTTP 요청 처리

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Extension, Json, Router,
};

use crate::{
    config::{AppConfig, AppState},
    entities,
    error::ErrorResponse,
    middleware::auth::optional_auth_middleware,
    utils::pagination::Pagination,
};

use super::dto::{
    CategoryRankingResponse, MyRankingDetailResponse, RankingListResponse, RankingPeriodQuery,
};
use super::service::RankingsService;

/// Rankings 라우터
pub fn router(app_config: AppConfig) -> Router<AppState> {
    Router::new()
        .route("/", get(list_rankings))
        .route("/me", get(my_ranking_detail))
        .route("/{category}", get(category_rankings))
        .route_layer(axum::middleware::from_fn_with_state(
            app_config.clone(),
            optional_auth_middleware,
        ))
}

/// 전체 랭킹 조회 (선택적 인증)
#[utoipa::path(
    get,
    path = "/api/v1/rankings",
    params(
        ("period" = Option<String>, Query, description = "Period filter (weekly, monthly, all_time)"),
        ("page" = Option<u64>, Query, description = "Page number"),
        ("per_page" = Option<u64>, Query, description = "Items per page"),
    ),
    responses(
        (status = 200, description = "Rankings retrieved successfully", body = RankingListResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    ),
    tag = "rankings"
)]
async fn list_rankings(
    State(state): State<AppState>,
    Query(query): Query<RankingPeriodQuery>,
    user: Option<Extension<entities::UsersModel>>,
) -> Result<impl IntoResponse, StatusCode> {
    let pagination = Pagination::new(query.page, query.per_page);
    let user_id = user.map(|u| u.id);

    let result = RankingsService::get_rankings(&state, &query.period, pagination, user_id).await;

    match result {
        Ok(response) => Ok(Json(response)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// 카테고리별 랭킹 조회 (공개)
#[utoipa::path(
    get,
    path = "/api/v1/rankings/{category}",
    params(
        ("category" = String, Path, description = "Category code"),
        ("page" = Option<u64>, Query, description = "Page number"),
        ("per_page" = Option<u64>, Query, description = "Items per page"),
    ),
    responses(
        (status = 200, description = "Category rankings retrieved successfully", body = CategoryRankingResponse),
        (status = 404, description = "Category not found", body = ErrorResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    ),
    tag = "rankings"
)]
async fn category_rankings(
    State(state): State<AppState>,
    Path(category): Path<String>,
    Query(query): Query<RankingPeriodQuery>,
) -> Result<impl IntoResponse, StatusCode> {
    let pagination = Pagination::new(query.page, query.per_page);

    let result = RankingsService::get_category_rankings(&state, &category, pagination).await;

    match result {
        Ok(response) => Ok(Json(response)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// 내 랭킹 상세 조회 (인증 필요)
#[utoipa::path(
    get,
    path = "/api/v1/rankings/me",
    responses(
        (status = 200, description = "My ranking retrieved successfully", body = MyRankingDetailResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    ),
    tag = "rankings",
    security(
        ("bearer_auth" = [])
    )
)]
async fn my_ranking_detail(
    State(state): State<AppState>,
    Extension(user): Extension<entities::UsersModel>,
) -> Result<impl IntoResponse, StatusCode> {
    let result = RankingsService::get_my_ranking_detail(&state, user.id).await;

    match result {
        Ok(response) => Ok(Json(response)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}
