//! Users API handlers
//!
//! 사용자 관련 HTTP 엔드포인트

use axum::{
    extract::{Path, Query, State},
    middleware::from_fn_with_state,
    routing::get,
    Extension, Json, Router,
};
use uuid::Uuid;

use crate::{
    config::{AppConfig, AppState},
    error::AppResult,
    middleware::{auth::User, auth_middleware},
    utils::pagination::PaginatedResponse,
};

use super::{
    dto::{
        UpdateUserDto, UserActivitiesQuery, UserActivityItem, UserActivityType, UserResponse,
        UserStatsResponse,
    },
    service,
};

/// GET /api/v1/users/{user_id} - 공개 프로필 조회
#[utoipa::path(
    get,
    path = "/api/v1/users/{user_id}",
    tag = "users",
    params(
        ("user_id" = Uuid, Path, description = "사용자 ID")
    ),
    responses(
        (status = 200, description = "사용자 프로필 조회 성공", body = UserResponse),
        (status = 404, description = "사용자를 찾을 수 없음")
    )
)]
pub async fn get_user_profile(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> AppResult<Json<UserResponse>> {
    let user = service::get_user_with_follow_counts(&state.db, user_id).await?;
    Ok(Json(user))
}

/// GET /api/v1/users/me - 내 프로필 조회
#[utoipa::path(
    get,
    path = "/api/v1/users/me",
    tag = "users",
    security(
        ("bearer_auth" = [])
    ),
    responses(
        (status = 200, description = "내 프로필 조회 성공", body = UserResponse),
        (status = 401, description = "인증 필요")
    )
)]
pub async fn get_my_profile(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
) -> AppResult<Json<UserResponse>> {
    let user = service::get_user_with_follow_counts(&state.db, user.id).await?;
    Ok(Json(user))
}

/// PATCH /api/v1/users/me - 프로필 수정
#[utoipa::path(
    patch,
    path = "/api/v1/users/me",
    tag = "users",
    security(
        ("bearer_auth" = [])
    ),
    request_body = UpdateUserDto,
    responses(
        (status = 200, description = "프로필 수정 성공", body = UserResponse),
        (status = 401, description = "인증 필요"),
        (status = 400, description = "잘못된 요청")
    )
)]
pub async fn update_my_profile(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Json(dto): Json<UpdateUserDto>,
) -> AppResult<Json<UserResponse>> {
    service::update_user_profile(&state.db, user.id, dto).await?;
    let user = service::get_user_with_follow_counts(&state.db, user.id).await?;
    Ok(Json(user))
}

/// GET /api/v1/users/me/activities - 활동 내역 조회
#[utoipa::path(
    get,
    path = "/api/v1/users/me/activities",
    tag = "users",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("type" = Option<UserActivityType>, Query, description = "활동 타입 필터 (post, spot, solution)"),
        ("page" = Option<u64>, Query, description = "페이지 번호 (기본 1)"),
        ("per_page" = Option<u64>, Query, description = "페이지당 개수 (기본 20, 최대 100)")
    ),
    responses(
        (status = 200, description = "활동 내역 조회 성공", body = PaginatedResponse<UserActivityItem>),
        (status = 401, description = "인증 필요")
    )
)]
pub async fn get_my_activities(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Query(params): Query<UserActivitiesQuery>,
) -> AppResult<Json<PaginatedResponse<UserActivityItem>>> {
    let UserActivitiesQuery {
        activity_type,
        pagination,
    } = params;

    let activities =
        service::list_user_activities(&state.db, user.id, activity_type, pagination).await?;

    Ok(Json(activities))
}

/// GET /api/v1/users/me/stats - 활동 통계 조회
#[utoipa::path(
    get,
    path = "/api/v1/users/me/stats",
    tag = "users",
    security(
        ("bearer_auth" = [])
    ),
    responses(
        (status = 200, description = "활동 통계 조회 성공", body = UserStatsResponse),
        (status = 401, description = "인증 필요")
    )
)]
pub async fn get_my_stats(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
) -> AppResult<Json<UserStatsResponse>> {
    let stats = service::get_user_stats(&state.db, user.id).await?;
    Ok(Json(stats))
}

/// Users 도메인 라우터
pub fn router(app_config: AppConfig) -> Router<AppState> {
    let protected_routes = Router::new()
        .route("/me", get(get_my_profile).patch(update_my_profile))
        .route("/me/activities", get(get_my_activities))
        .route("/me/stats", get(get_my_stats))
        .route_layer(from_fn_with_state(app_config, auth_middleware));

    Router::new()
        .route("/{user_id}", get(get_user_profile))
        .merge(protected_routes)
}
