//! Users API handlers
//!
//! 사용자 관련 HTTP 엔드포인트

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    middleware::from_fn_with_state,
    routing::{get, post},
    Extension, Json, Router,
};
use uuid::Uuid;

use crate::{
    config::{AppConfig, AppState},
    error::AppResult,
    middleware::{auth::User, auth_middleware},
    utils::pagination::{PaginatedResponse, Pagination},
};

use super::{
    dto::{
        FollowStatusResponse, LikedItem, SavedItem, SocialAccountResponse, TryItem, UpdateUserDto,
        UserActivitiesQuery, UserActivityItem, UserActivityType, UserResponse, UserSolutionItem,
        UserSpotItem, UserStatsResponse,
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
    let user = service::get_user_with_follow_counts(state.db.as_ref(), user_id).await?;
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
    let user = service::get_user_with_follow_counts(state.db.as_ref(), user.id).await?;
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
    service::update_user_profile(state.db.as_ref(), user.id, dto).await?;
    let user = service::get_user_with_follow_counts(state.db.as_ref(), user.id).await?;
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
        service::list_user_activities(state.db.as_ref(), user.id, activity_type, pagination)
            .await?;

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
    let stats = service::get_user_stats(state.db.as_ref(), user.id).await?;
    Ok(Json(stats))
}

/// GET /api/v1/users/me/tries - VTON 히스토리 조회
#[utoipa::path(
    get,
    path = "/api/v1/users/me/tries",
    tag = "users",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("page" = Option<u64>, Query, description = "페이지 번호 (기본 1)"),
        ("per_page" = Option<u64>, Query, description = "페이지당 개수 (기본 20, 최대 50)")
    ),
    responses(
        (status = 200, description = "VTON 히스토리 조회 성공", body = PaginatedResponse<TryItem>),
        (status = 401, description = "인증 필요")
    )
)]
pub async fn get_my_tries(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Query(pagination): Query<Pagination>,
) -> AppResult<Json<PaginatedResponse<TryItem>>> {
    let result = service::list_my_tries(state.db.as_ref(), user.id, pagination).await?;
    Ok(Json(result))
}

/// GET /api/v1/users/me/saved - 저장된 포스트 조회
#[utoipa::path(
    get,
    path = "/api/v1/users/me/saved",
    tag = "users",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("page" = Option<u64>, Query, description = "페이지 번호 (기본 1)"),
        ("per_page" = Option<u64>, Query, description = "페이지당 개수 (기본 20, 최대 50)")
    ),
    responses(
        (status = 200, description = "저장된 포스트 조회 성공", body = PaginatedResponse<SavedItem>),
        (status = 401, description = "인증 필요")
    )
)]
pub async fn get_my_saved(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Query(pagination): Query<Pagination>,
) -> AppResult<Json<PaginatedResponse<SavedItem>>> {
    let result = service::list_my_saved(state.db.as_ref(), user.id, pagination).await?;
    Ok(Json(result))
}

/// GET /api/v1/users/me/liked - 좋아요한 포스트 조회
#[utoipa::path(
    get,
    path = "/api/v1/users/me/liked",
    tag = "users",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("page" = Option<u64>, Query, description = "페이지 번호 (기본 1)"),
        ("per_page" = Option<u64>, Query, description = "페이지당 개수 (기본 20, 최대 50)")
    ),
    responses(
        (status = 200, description = "좋아요한 포스트 조회 성공", body = PaginatedResponse<LikedItem>),
        (status = 401, description = "인증 필요")
    )
)]
pub async fn get_my_liked(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Query(pagination): Query<Pagination>,
) -> AppResult<Json<PaginatedResponse<LikedItem>>> {
    let result = service::list_my_liked(state.db.as_ref(), user.id, pagination).await?;
    Ok(Json(result))
}

/// POST /api/v1/users/{user_id}/follow - 팔로우
#[utoipa::path(
    post,
    path = "/api/v1/users/{user_id}/follow",
    tag = "users",
    security(("bearer_auth" = [])),
    params(("user_id" = Uuid, Path, description = "팔로우할 사용자 ID")),
    responses(
        (status = 204, description = "팔로우 성공"),
        (status = 400, description = "자기 자신을 팔로우할 수 없음"),
        (status = 401, description = "인증 필요"),
        (status = 404, description = "사용자를 찾을 수 없음")
    )
)]
pub async fn follow_user_handler(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Path(target_id): Path<Uuid>,
) -> AppResult<StatusCode> {
    service::follow_user(&state.db, user.id, target_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

/// DELETE /api/v1/users/{user_id}/follow - 언팔로우
#[utoipa::path(
    delete,
    path = "/api/v1/users/{user_id}/follow",
    tag = "users",
    security(("bearer_auth" = [])),
    params(("user_id" = Uuid, Path, description = "언팔로우할 사용자 ID")),
    responses(
        (status = 204, description = "언팔로우 성공"),
        (status = 401, description = "인증 필요")
    )
)]
pub async fn unfollow_user_handler(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Path(target_id): Path<Uuid>,
) -> AppResult<StatusCode> {
    service::unfollow_user(&state.db, user.id, target_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

/// GET /api/v1/users/{user_id}/follow-status - 팔로우 여부 확인
#[utoipa::path(
    get,
    path = "/api/v1/users/{user_id}/follow-status",
    tag = "users",
    security(("bearer_auth" = [])),
    params(("user_id" = Uuid, Path, description = "대상 사용자 ID")),
    responses(
        (status = 200, description = "팔로우 상태 조회 성공", body = FollowStatusResponse),
        (status = 401, description = "인증 필요")
    )
)]
pub async fn get_follow_status(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Path(target_id): Path<Uuid>,
) -> AppResult<Json<FollowStatusResponse>> {
    let is_following = service::check_is_following(&state.db, user.id, target_id).await?;
    Ok(Json(FollowStatusResponse { is_following }))
}

/// GET /api/v1/users/me/spots - 내 Spot 목록
#[utoipa::path(
    get,
    path = "/api/v1/users/me/spots",
    tag = "Users",
    summary = "GET /api/v1/users/me/spots - 내 Spot 목록",
    params(
        ("page" = Option<u64>, Query, description = "Page number"),
        ("per_page" = Option<u64>, Query, description = "Items per page (max 50)"),
    ),
    responses(
        (status = 200, description = "Spot 목록", body = PaginatedResponse<UserSpotItem>),
        (status = 401, description = "인증 필요"),
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_my_spots(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Query(pagination): Query<Pagination>,
) -> AppResult<Json<PaginatedResponse<UserSpotItem>>> {
    let result = service::list_user_spots(&state.db, user.id, pagination).await?;
    Ok(Json(result))
}

/// GET /api/v1/users/me/solutions - 내 Solution 목록
#[utoipa::path(
    get,
    path = "/api/v1/users/me/solutions",
    tag = "Users",
    summary = "GET /api/v1/users/me/solutions - 내 Solution 목록",
    params(
        ("page" = Option<u64>, Query, description = "Page number"),
        ("per_page" = Option<u64>, Query, description = "Items per page (max 50)"),
    ),
    responses(
        (status = 200, description = "Solution 목록", body = PaginatedResponse<UserSolutionItem>),
        (status = 401, description = "인증 필요"),
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_my_solutions(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Query(pagination): Query<Pagination>,
) -> AppResult<Json<PaginatedResponse<UserSolutionItem>>> {
    let result = service::list_user_solutions(&state.db, user.id, pagination).await?;
    Ok(Json(result))
}

/// GET /api/v1/users/me/social-accounts - 내 소셜 계정 목록
#[utoipa::path(
    get,
    path = "/api/v1/users/me/social-accounts",
    tag = "Users",
    summary = "GET /api/v1/users/me/social-accounts - 내 소셜 계정 목록",
    responses(
        (status = 200, description = "소셜 계정 목록", body = Vec<SocialAccountResponse>),
        (status = 401, description = "인증 필요"),
    ),
    security(("bearer_auth" = []))
)]
pub async fn get_my_social_accounts(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
) -> AppResult<Json<Vec<SocialAccountResponse>>> {
    let accounts = service::list_social_accounts(&state.db, user.id).await?;
    Ok(Json(accounts))
}

/// Users 도메인 라우터
pub fn router(app_config: AppConfig) -> Router<AppState> {
    let protected_routes = Router::new()
        .route("/me", get(get_my_profile).patch(update_my_profile))
        .route("/me/activities", get(get_my_activities))
        .route("/me/stats", get(get_my_stats))
        .route("/me/tries", get(get_my_tries))
        .route("/me/saved", get(get_my_saved))
        .route("/me/liked", get(get_my_liked))
        .route(
            "/{user_id}/follow",
            post(follow_user_handler).delete(unfollow_user_handler),
        )
        .route("/{user_id}/follow-status", get(get_follow_status))
        .route("/me/spots", get(get_my_spots))
        .route("/me/solutions", get(get_my_solutions))
        .route("/me/social-accounts", get(get_my_social_accounts))
        .route_layer(from_fn_with_state(app_config, auth_middleware));

    Router::new()
        .route("/{user_id}", get(get_user_profile))
        .merge(protected_routes)
}
