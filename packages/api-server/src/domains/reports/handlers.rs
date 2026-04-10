//! Reports HTTP handlers
//!
//! POST /api/v1/reports — 인증 사용자 신고 생성
//! GET /api/v1/admin/reports — Admin 신고 목록
//! PATCH /api/v1/admin/reports/{id} — Admin 신고 상태 변경

use axum::{
    extract::{Path, Query, State},
    routing::{get, patch, post},
    Json, Router,
};
use uuid::Uuid;

use crate::{
    config::{AppConfig, AppState},
    error::AppResult,
    middleware::auth::User,
    utils::pagination::PaginatedResponse,
};

use super::{
    dto::{
        AdminReportListQuery, CreateReportDto, ReportListItem, ReportResponse,
        UpdateReportStatusDto,
    },
    service,
};

// ─── Public (authenticated) ──────────────────────────────────────────────────

/// POST /api/v1/reports
#[utoipa::path(
    post,
    path = "/api/v1/reports",
    tag = "reports",
    security(("bearer_auth" = [])),
    request_body = CreateReportDto,
    responses(
        (status = 201, description = "Report created", body = ReportResponse),
        (status = 400, description = "Duplicate report or invalid input"),
        (status = 401, description = "Authentication required")
    )
)]
async fn create_report(
    State(state): State<AppState>,
    axum::Extension(user): axum::Extension<User>,
    Json(dto): Json<CreateReportDto>,
) -> AppResult<Json<ReportResponse>> {
    let valid_types = ["post", "comment", "solution"];
    if !valid_types.contains(&dto.target_type.as_str()) {
        return Err(crate::error::AppError::BadRequest(format!(
            "Invalid target_type. Must be one of: {}",
            valid_types.join(", ")
        )));
    }

    let valid_reasons = ["spam", "inappropriate", "copyright", "incorrect", "other"];
    if !valid_reasons.contains(&dto.reason.as_str()) {
        return Err(crate::error::AppError::BadRequest(format!(
            "Invalid reason. Must be one of: {}",
            valid_reasons.join(", ")
        )));
    }

    let report = service::create_report(
        state.db.as_ref(),
        user.id,
        &dto.target_type,
        dto.target_id,
        &dto.reason,
        dto.details.as_deref(),
    )
    .await?;

    Ok(Json(report))
}

/// Public reports router (authenticated)
pub fn public_router(app_config: AppConfig) -> Router<AppState> {
    Router::new()
        .route("/", post(create_report))
        .layer(axum::middleware::from_fn_with_state(
            app_config,
            crate::middleware::auth_middleware,
        ))
}

// ─── Admin ───────────────────────────────────────────────────────────────────

/// GET /api/v1/admin/reports
#[utoipa::path(
    get,
    path = "/api/v1/admin/reports",
    tag = "admin",
    security(("bearer_auth" = [])),
    params(
        ("status" = Option<String>, Query, description = "상태 필터 (pending, reviewed, dismissed, actioned)"),
        ("target_type" = Option<String>, Query, description = "대상 타입 필터"),
        ("page" = Option<u64>, Query, description = "페이지 번호"),
        ("per_page" = Option<u64>, Query, description = "페이지당 개수")
    ),
    responses(
        (status = 200, description = "Report list", body = PaginatedResponse<ReportListItem>),
        (status = 401, description = "Unauthorized"),
        (status = 403, description = "Forbidden")
    )
)]
async fn admin_list_reports(
    State(state): State<AppState>,
    _extension: axum::Extension<User>,
    Query(query): Query<AdminReportListQuery>,
) -> AppResult<Json<PaginatedResponse<ReportListItem>>> {
    let reports = service::admin_list_reports(state.db.as_ref(), query).await?;
    Ok(Json(reports))
}

/// PATCH /api/v1/admin/reports/{id}
#[utoipa::path(
    patch,
    path = "/api/v1/admin/reports/{id}",
    tag = "admin",
    security(("bearer_auth" = [])),
    params(
        ("id" = Uuid, Path, description = "Report ID")
    ),
    request_body = UpdateReportStatusDto,
    responses(
        (status = 200, description = "Report updated", body = ReportListItem),
        (status = 401, description = "Unauthorized"),
        (status = 403, description = "Forbidden"),
        (status = 404, description = "Report not found")
    )
)]
async fn admin_update_report(
    State(state): State<AppState>,
    axum::Extension(user): axum::Extension<User>,
    Path(report_id): Path<Uuid>,
    Json(dto): Json<UpdateReportStatusDto>,
) -> AppResult<Json<ReportListItem>> {
    let report =
        service::admin_update_report_status(state.db.as_ref(), report_id, user.id, dto).await?;
    Ok(Json(report))
}

/// Admin reports router
pub fn admin_router(app_config: AppConfig) -> Router<AppState> {
    Router::new()
        .route("/", get(admin_list_reports))
        .route("/{id}", patch(admin_update_report))
        .layer(axum::middleware::from_fn_with_state(
            app_config.clone(),
            crate::middleware::auth_middleware,
        ))
        .layer(axum::middleware::from_fn(
            crate::middleware::admin_middleware,
        ))
}
