//! Earnings API handlers
//!
//! 클릭 추적 및 수익/정산 관련 HTTP 엔드포인트

use axum::{
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    middleware::from_fn_with_state,
    response::IntoResponse,
    routing::{get, post},
    Extension, Json, Router,
};
use uuid::Uuid;

use crate::{
    config::{AppConfig, AppState},
    error::{AppError, AppResult},
    middleware::{auth::optional_auth_middleware, auth::User},
};

use super::{
    dto::{
        ClickStatsResponse, CreateClickDto, EarningsResponse, SettlementsResponse, WithdrawRequest,
    },
    service,
};

/// Earnings 라우터
pub fn router(app_config: AppConfig) -> Router<AppState> {
    Router::new()
        .route("/clicks", post(create_click))
        .route("/clicks/stats", get(get_click_stats))
        .route("/earnings", get(get_earnings))
        .route("/settlements", get(get_settlements))
        .route("/settlements/withdraw", post(create_withdraw))
        .route("/settlements/withdraw/{id}", get(get_withdraw_status))
        .route_layer(from_fn_with_state(
            app_config.clone(),
            optional_auth_middleware,
        ))
}

/// POST /api/v1/clicks - 클릭 기록
#[utoipa::path(
    post,
    path = "/api/v1/clicks",
    tag = "earnings",
    request_body = CreateClickDto,
    responses(
        (status = 201, description = "클릭 기록 성공"),
        (status = 400, description = "잘못된 요청 (부정 클릭 방지)"),
        (status = 404, description = "Solution을 찾을 수 없음")
    )
)]
pub async fn create_click(
    State(state): State<AppState>,
    Extension(user): Extension<Option<User>>,
    headers: HeaderMap,
    Json(dto): Json<CreateClickDto>,
) -> AppResult<impl IntoResponse> {
    // IP 주소 추출 (X-Forwarded-For 또는 X-Real-IP 우선)
    let ip_address = headers
        .get("X-Forwarded-For")
        .or_else(|| headers.get("X-Real-IP"))
        .and_then(|h| h.to_str().ok())
        .map(|s| s.split(',').next().unwrap_or("").trim().to_string())
        .unwrap_or_else(|| "0.0.0.0".to_string());

    // User-Agent 추출
    let user_agent = headers
        .get("User-Agent")
        .and_then(|h| h.to_str().ok())
        .map(|s| s.to_string());

    // 클릭 로그 저장
    service::create_click_log(
        &state.db,
        user.as_ref().map(|u| u.id),
        dto.solution_id,
        ip_address,
        user_agent,
        dto.referrer,
    )
    .await?;

    Ok((StatusCode::CREATED, Json(())))
}

/// GET /api/v1/clicks/stats - 클릭 통계 조회
#[utoipa::path(
    get,
    path = "/api/v1/clicks/stats",
    tag = "earnings",
    security(
        ("bearer_auth" = [])
    ),
    responses(
        (status = 200, description = "클릭 통계 조회 성공", body = ClickStatsResponse),
        (status = 401, description = "인증 필요")
    )
)]
pub async fn get_click_stats(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
) -> AppResult<Json<ClickStatsResponse>> {
    let stats = service::get_click_stats_by_user(&state.db, user.id).await?;
    Ok(Json(stats))
}

/// GET /api/v1/earnings - 수익 현황 조회 (임시 구현)
#[utoipa::path(
    get,
    path = "/api/v1/earnings",
    tag = "earnings",
    security(
        ("bearer_auth" = [])
    ),
    responses(
        (status = 200, description = "수익 현황 조회 성공 (임시 구현)", body = EarningsResponse),
        (status = 401, description = "인증 필요")
    )
)]
pub async fn get_earnings(Extension(_user): Extension<User>) -> AppResult<Json<EarningsResponse>> {
    // Phase 15 임시 구현: 빈 데이터 반환
    Ok(Json(EarningsResponse {
        total_earnings: 0,
        available_balance: 0,
        pending_settlement: 0,
        monthly_earnings: vec![],
    }))
}

/// GET /api/v1/settlements - 정산 내역 조회 (임시 구현)
#[utoipa::path(
    get,
    path = "/api/v1/settlements",
    tag = "earnings",
    security(
        ("bearer_auth" = [])
    ),
    responses(
        (status = 200, description = "정산 내역 조회 성공 (임시 구현)", body = SettlementsResponse),
        (status = 401, description = "인증 필요")
    )
)]
pub async fn get_settlements(
    Extension(_user): Extension<User>,
) -> AppResult<Json<SettlementsResponse>> {
    // Phase 15 임시 구현: 빈 배열 반환
    Ok(Json(SettlementsResponse { data: vec![] }))
}

/// POST /api/v1/settlements/withdraw - 출금 신청 (임시 구현)
#[utoipa::path(
    post,
    path = "/api/v1/settlements/withdraw",
    tag = "earnings",
    security(
        ("bearer_auth" = [])
    ),
    request_body = WithdrawRequest,
    responses(
        (status = 400, description = "아직 지원하지 않습니다"),
        (status = 401, description = "인증 필요")
    )
)]
pub async fn create_withdraw(
    Extension(_user): Extension<User>,
    Json(_dto): Json<WithdrawRequest>,
) -> Result<StatusCode, AppError> {
    // Phase 15 임시 구현: 400 에러 반환
    Err(AppError::BadRequest(
        "아직 지원하지 않습니다. 향후 필요 시 구현 예정입니다.".to_string(),
    ))
}

/// GET /api/v1/settlements/withdraw/{id} - 출금 상태 조회 (임시 구현)
#[utoipa::path(
    get,
    path = "/api/v1/settlements/withdraw/{id}",
    tag = "earnings",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("id" = Uuid, Path, description = "출금 신청 ID")
    ),
    responses(
        (status = 404, description = "출금 신청을 찾을 수 없음"),
        (status = 401, description = "인증 필요")
    )
)]
pub async fn get_withdraw_status(
    Extension(_user): Extension<User>,
    Path(_id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    // Phase 15 임시 구현: 404 에러 반환
    Err(AppError::NotFound(
        "출금 신청을 찾을 수 없습니다".to_string(),
    ))
}
