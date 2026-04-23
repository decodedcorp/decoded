//! Admin Posts 관리
//!
//! 관리자용 Post 목록 조회 및 상태 변경

use axum::{
    extract::{Path, Query, State},
    routing::{get, patch},
    Json, Router,
};
use uuid::Uuid;

use crate::{
    config::{AppConfig, AppState},
    domains::posts::{
        dto::{PostListItem, PostListQuery, UpdatePostDto},
        service,
    },
    error::AppResult,
    middleware::auth::User,
    utils::pagination::PaginatedResponse,
};

/// Admin용 Post 목록 조회 쿼리 (status 필터 추가)
#[derive(Debug, Clone, serde::Deserialize, utoipa::ToSchema)]
pub struct AdminPostListQuery {
    /// 상태 필터 (active, hidden, deleted 등)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,

    /// 통합 검색어 (artist_name | group_name | context 에 부분매칭 OR).
    /// 2글자 이상 권장. 주로 admin 자동완성 UX 에서 사용.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub q: Option<String>,

    /// 기존 PostListQuery 필드들
    #[serde(flatten)]
    pub base_query: PostListQuery,
}

/// Post 상태 변경 요청
#[derive(Debug, Clone, serde::Deserialize, utoipa::ToSchema)]
pub struct PostStatusUpdate {
    /// 새로운 상태 (active, hidden, deleted 등)
    pub status: String,
}

/// GET /api/v1/admin/posts - Admin용 Post 목록 조회
///
/// 모든 상태의 Post를 조회할 수 있으며, status 필터로 특정 상태만 필터링 가능
#[utoipa::path(
    get,
    path = "/api/v1/admin/posts",
    operation_id = "admin_list_posts",
    tag = "admin",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("status" = Option<String>, Query, description = "상태 필터 (active, hidden, deleted 등)"),
        ("q" = Option<String>, Query, description = "통합 검색어 (artist_name/group_name/context 부분매칭 OR)"),
        ("artist_name" = Option<String>, Query, description = "아티스트명 필터 (정확매칭)"),
        ("group_name" = Option<String>, Query, description = "그룹명 필터 (정확매칭)"),
        ("context" = Option<String>, Query, description = "상황 필터 (정확매칭)"),
        ("user_id" = Option<Uuid>, Query, description = "사용자 ID 필터"),
        ("sort" = Option<String>, Query, description = "정렬: recent | popular | trending"),
        ("page" = Option<u64>, Query, description = "페이지 번호"),
        ("per_page" = Option<u64>, Query, description = "페이지당 개수")
    ),
    responses(
        (status = 200, description = "Post 목록 조회 성공", body = PaginatedResponse<PostListItem>),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "Admin 권한 필요")
    )
)]
pub async fn list_posts(
    State(state): State<AppState>,
    _extension: axum::Extension<User>, // Admin 미들웨어에서 이미 검증됨
    Query(query): Query<AdminPostListQuery>,
) -> AppResult<Json<PaginatedResponse<PostListItem>>> {
    // status 필터가 있으면 적용, 없으면 모든 상태 조회
    let posts = service::admin_list_posts(state.db.as_ref(), query).await?;
    Ok(Json(posts))
}

/// PATCH /api/v1/admin/posts/{id}/status - Post 상태 변경
#[utoipa::path(
    patch,
    path = "/api/v1/admin/posts/{id}/status",
    tag = "admin",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("id" = Uuid, Path, description = "Post ID")
    ),
    request_body = PostStatusUpdate,
    responses(
        (status = 200, description = "상태 변경 성공", body = crate::domains::posts::dto::PostResponse),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "Admin 권한 필요"),
        (status = 404, description = "Post를 찾을 수 없음")
    )
)]
pub async fn update_post_status(
    State(state): State<AppState>,
    axum::Extension(user): axum::Extension<User>,
    Path(post_id): Path<Uuid>,
    Json(dto): Json<PostStatusUpdate>,
) -> AppResult<Json<crate::domains::posts::dto::PostResponse>> {
    // 상태 유효성 검증
    let valid_statuses = ["active", "hidden", "deleted"];
    if !valid_statuses.contains(&dto.status.as_str()) {
        return Err(crate::error::AppError::BadRequest(format!(
            "Invalid status. Must be one of: {}",
            valid_statuses.join(", ")
        )));
    }

    let post = service::admin_update_post_status(
        &state.search_client,
        state.db.as_ref(),
        post_id,
        &dto.status,
        user.id,
    )
    .await?;
    Ok(Json(post))
}

/// PATCH /api/v1/admin/posts/{id} - Admin용 Post 메타데이터 수정
#[utoipa::path(
    patch,
    path = "/api/v1/admin/posts/{id}",
    tag = "admin",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "Post ID")),
    request_body = UpdatePostDto,
    responses(
        (status = 200, description = "수정 성공", body = crate::domains::posts::dto::PostResponse),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "Admin 권한 필요"),
        (status = 404, description = "Post를 찾을 수 없음")
    )
)]
pub async fn admin_update_post(
    State(state): State<AppState>,
    axum::Extension(user): axum::Extension<User>,
    Path(post_id): Path<Uuid>,
    Json(dto): Json<UpdatePostDto>,
) -> AppResult<Json<crate::domains::posts::dto::PostResponse>> {
    let post = service::admin_update_post(&state, post_id, dto, user.id).await?;
    Ok(Json(post))
}

/// Admin Posts 라우터
pub fn router(app_config: AppConfig) -> Router<AppState> {
    Router::new()
        .route("/", get(list_posts))
        .route("/{id}", patch(admin_update_post))
        .route("/{id}/status", patch(update_post_status))
        .layer(axum::middleware::from_fn_with_state(
            app_config.clone(),
            crate::middleware::auth_middleware,
        ))
        .layer(axum::middleware::from_fn(
            crate::middleware::admin_middleware,
        ))
}
