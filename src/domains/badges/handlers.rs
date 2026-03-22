//! Badges 도메인 핸들러
//!
//! HTTP 요청 처리

use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Extension, Json, Router,
};

use crate::{
    config::{AppConfig, AppState},
    entities,
    error::{AppError, ErrorResponse},
    middleware::auth::optional_auth_middleware,
};

use super::dto::{BadgeListResponse, BadgeResponse, MyBadgesResponse};
use super::service::BadgesService;

/// Badges 라우터
pub fn router(app_config: AppConfig) -> Router<AppState> {
    Router::new()
        .route("/", get(list_badges))
        .route("/me", get(my_badges))
        .route("/{badge_id}", get(get_badge))
        .route_layer(axum::middleware::from_fn_with_state(
            app_config.clone(),
            optional_auth_middleware,
        ))
}

/// 전체 뱃지 목록 조회 (공개)
#[utoipa::path(
    get,
    path = "/api/v1/badges",
    responses(
        (status = 200, description = "Badges retrieved successfully", body = BadgeListResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    ),
    tag = "Badges"
)]
async fn list_badges(State(state): State<AppState>) -> Result<impl IntoResponse, StatusCode> {
    let result = BadgesService::list_badges(&state).await;

    match result {
        Ok(badges) => Ok(Json(BadgeListResponse { data: badges })),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// 내 뱃지 조회 (인증 필요)
#[utoipa::path(
    get,
    path = "/api/v1/badges/me",
    responses(
        (status = 200, description = "My badges retrieved successfully", body = MyBadgesResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    ),
    tag = "Badges",
    security(
        ("bearer" = [])
    )
)]
async fn my_badges(
    State(state): State<AppState>,
    Extension(user): Extension<entities::UsersModel>,
) -> Result<impl IntoResponse, StatusCode> {
    let result = BadgesService::get_my_badges(&state, user.id).await;

    match result {
        Ok(response) => Ok(Json(response)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

/// 뱃지 상세 조회 (공개)
#[utoipa::path(
    get,
    path = "/api/v1/badges/{badge_id}",
    params(
        ("badge_id" = Uuid, Path, description = "Badge ID")
    ),
    responses(
        (status = 200, description = "Badge retrieved successfully", body = BadgeResponse),
        (status = 404, description = "Badge not found", body = ErrorResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    ),
    tag = "Badges"
)]
async fn get_badge(
    State(state): State<AppState>,
    Path(badge_id): Path<uuid::Uuid>,
) -> Result<impl IntoResponse, StatusCode> {
    let result = BadgesService::get_badge_by_id(&state, badge_id).await;

    match result {
        Ok(badge) => Ok(Json(badge)),
        Err(e) => {
            if matches!(e, AppError::NotFound(_)) {
                Err(StatusCode::NOT_FOUND)
            } else {
                Err(StatusCode::INTERNAL_SERVER_ERROR)
            }
        }
    }
}
