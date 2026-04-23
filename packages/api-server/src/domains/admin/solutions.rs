//! Admin Solutions 관리
//!
//! 관리자용 Solution 목록 조회 및 상태 변경

use axum::{
    extract::{Path, Query, State},
    routing::{get, patch},
    Json, Router,
};
use uuid::Uuid;

use crate::{
    config::{AppConfig, AppState},
    domains::solutions::{dto::SolutionListItem, service},
    error::AppResult,
    middleware::auth::User,
    utils::pagination::PaginatedResponse,
};

/// Admin용 Solution 목록 조회 쿼리 (status 필터 추가)
#[derive(Debug, Clone, serde::Deserialize, utoipa::ToSchema)]
pub struct AdminSolutionListQuery {
    /// 상태 필터 (active, hidden, deleted 등)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,

    /// Spot ID 필터
    #[serde(skip_serializing_if = "Option::is_none")]
    pub spot_id: Option<Uuid>,

    /// 사용자 ID 필터
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_id: Option<Uuid>,

    /// 정렬 방식
    #[serde(default = "default_sort")]
    pub sort: String, // 'recent' | 'popular' | 'verified' | 'adopted'

    /// 페이지네이션 설정
    #[serde(flatten)]
    pub pagination: crate::utils::pagination::Pagination,
}

fn default_sort() -> String {
    "recent".to_string()
}

/// Solution 상태 변경 요청
#[derive(Debug, Clone, serde::Deserialize, utoipa::ToSchema)]
pub struct SolutionStatusUpdate {
    /// 새로운 상태 (active, hidden, deleted 등)
    pub status: String,
}

/// GET /api/v1/admin/solutions - Admin용 Solution 목록 조회
///
/// 모든 상태의 Solution을 조회할 수 있으며, status 필터로 특정 상태만 필터링 가능
#[utoipa::path(
    get,
    path = "/api/v1/admin/solutions",
    operation_id = "admin_list_solutions",
    tag = "admin",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("status" = Option<String>, Query, description = "상태 필터 (active, hidden, deleted 등)"),
        ("spot_id" = Option<Uuid>, Query, description = "Spot ID 필터"),
        ("user_id" = Option<Uuid>, Query, description = "사용자 ID 필터"),
        ("sort" = Option<String>, Query, description = "정렬: recent | popular | verified | adopted"),
        ("page" = Option<u64>, Query, description = "페이지 번호"),
        ("per_page" = Option<u64>, Query, description = "페이지당 개수")
    ),
    responses(
        (status = 200, description = "Solution 목록 조회 성공", body = PaginatedResponse<SolutionListItem>),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "Admin 권한 필요")
    )
)]
pub async fn list_solutions(
    State(state): State<AppState>,
    _extension: axum::Extension<User>, // Admin 미들웨어에서 이미 검증됨
    Query(query): Query<AdminSolutionListQuery>,
) -> AppResult<Json<PaginatedResponse<SolutionListItem>>> {
    let solutions = service::admin_list_solutions(state.db.as_ref(), query).await?;
    Ok(Json(solutions))
}

/// PATCH /api/v1/admin/solutions/{id}/status - Solution 상태 변경
#[utoipa::path(
    patch,
    path = "/api/v1/admin/solutions/{id}/status",
    tag = "admin",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("id" = Uuid, Path, description = "Solution ID")
    ),
    request_body = SolutionStatusUpdate,
    responses(
        (status = 200, description = "상태 변경 성공", body = crate::domains::solutions::dto::SolutionResponse),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "Admin 권한 필요"),
        (status = 404, description = "Solution을 찾을 수 없음")
    )
)]
pub async fn update_solution_status(
    State(state): State<AppState>,
    _extension: axum::Extension<User>, // Admin 미들웨어에서 이미 검증됨
    Path(solution_id): Path<Uuid>,
    Json(dto): Json<SolutionStatusUpdate>,
) -> AppResult<Json<crate::domains::solutions::dto::SolutionResponse>> {
    // 상태 유효성 검증
    let valid_statuses = ["active", "hidden", "deleted"];
    if !valid_statuses.contains(&dto.status.as_str()) {
        return Err(crate::error::AppError::BadRequest(format!(
            "Invalid status. Must be one of: {}",
            valid_statuses.join(", ")
        )));
    }

    let solution =
        service::admin_update_solution_status(state.db.as_ref(), solution_id, &dto.status).await?;
    Ok(Json(solution))
}

/// Admin Solutions 라우터
pub fn router(app_config: AppConfig) -> Router<AppState> {
    Router::new()
        .route("/", get(list_solutions))
        .route("/{id}/status", patch(update_solution_status))
        // Layer order: admin INNER, auth OUTER — see #257.
        .layer(axum::middleware::from_fn(
            crate::middleware::admin_middleware,
        ))
        .layer(axum::middleware::from_fn_with_state(
            app_config.clone(),
            crate::middleware::auth_middleware,
        ))
}
