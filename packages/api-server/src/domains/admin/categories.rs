//! Admin Categories 관리
//!
//! 관리자용 카테고리 생성, 수정, 순서 변경, 활성화/비활성화

use axum::{
    extract::{Path, State},
    routing::{patch, post, put},
    Json, Router,
};
use uuid::Uuid;

use crate::{
    config::{AppConfig, AppState},
    domains::categories::dto::{CategoryDescription, CategoryName, CategoryResponse},
    error::AppResult,
    middleware::auth::User,
};
use validator::Validate;

/// 카테고리 생성 요청
#[derive(Debug, Clone, serde::Deserialize, utoipa::ToSchema, Validate)]
pub struct CreateCategoryDto {
    /// 카테고리 코드 (예: 'fashion', 'living', 'tech', 'beauty')
    #[validate(length(min = 1, max = 128))]
    pub code: String,

    /// 다국어 카테고리명
    pub name: CategoryName,

    /// 아이콘 URL (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub icon_url: Option<String>,

    /// 색상 hex 코드 (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color_hex: Option<String>,

    /// 다국어 설명 (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<CategoryDescription>,

    /// 표시 순서 (기본값: 마지막)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_order: Option<i32>,
}

/// 카테고리 수정 요청
#[derive(Debug, Clone, serde::Deserialize, utoipa::ToSchema, Validate)]
pub struct UpdateCategoryDto {
    /// 카테고리 코드 (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(length(max = 128))]
    pub code: Option<String>,

    /// 다국어 카테고리명 (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<CategoryName>,

    /// 아이콘 URL (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(length(max = 2048))]
    pub icon_url: Option<String>,

    /// 색상 hex 코드 (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    #[validate(length(max = 16))]
    pub color_hex: Option<String>,

    /// 다국어 설명 (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<CategoryDescription>,

    /// 표시 순서 (옵션)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_order: Option<i32>,
}

/// 카테고리 순서 변경 요청
#[derive(Debug, Clone, serde::Deserialize, utoipa::ToSchema)]
pub struct CategoryOrderUpdate {
    /// 카테고리 ID와 새 순서의 매핑
    pub orders: Vec<CategoryOrderItem>,
}

/// 카테고리 순서 아이템
#[derive(Debug, Clone, serde::Deserialize, utoipa::ToSchema)]
pub struct CategoryOrderItem {
    /// 카테고리 ID
    pub category_id: Uuid,

    /// 새 표시 순서
    pub display_order: i32,
}

/// 카테고리 상태 변경 요청
#[derive(Debug, Clone, serde::Deserialize, utoipa::ToSchema)]
pub struct CategoryStatusUpdate {
    /// 활성화 여부
    pub is_active: bool,
}

/// POST /api/v1/admin/categories - 카테고리 생성
#[utoipa::path(
    post,
    path = "/api/v1/admin/categories",
    tag = "admin",
    security(
        ("bearer_auth" = [])
    ),
    request_body = CreateCategoryDto,
    responses(
        (status = 201, description = "카테고리 생성 성공", body = CategoryResponse),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "Admin 권한 필요"),
        (status = 400, description = "잘못된 요청")
    )
)]
pub async fn create_category(
    State(state): State<AppState>,
    _extension: axum::Extension<User>, // Admin 미들웨어에서 이미 검증됨
    Json(dto): Json<CreateCategoryDto>,
) -> AppResult<Json<CategoryResponse>> {
    let category =
        crate::domains::categories::service::admin_create_category(state.db.as_ref(), dto).await?;
    Ok(Json(category))
}

/// PATCH /api/v1/admin/categories/{id} - 카테고리 수정
#[utoipa::path(
    patch,
    path = "/api/v1/admin/categories/{id}",
    tag = "admin",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("id" = Uuid, Path, description = "Category ID")
    ),
    request_body = UpdateCategoryDto,
    responses(
        (status = 200, description = "카테고리 수정 성공", body = CategoryResponse),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "Admin 권한 필요"),
        (status = 404, description = "카테고리를 찾을 수 없음")
    )
)]
pub async fn update_category(
    State(state): State<AppState>,
    _extension: axum::Extension<User>, // Admin 미들웨어에서 이미 검증됨
    Path(category_id): Path<Uuid>,
    Json(dto): Json<UpdateCategoryDto>,
) -> AppResult<Json<CategoryResponse>> {
    let category = crate::domains::categories::service::admin_update_category(
        state.db.as_ref(),
        category_id,
        dto,
    )
    .await?;
    Ok(Json(category))
}

/// PUT /api/v1/admin/categories/order - 카테고리 순서 변경
#[utoipa::path(
    put,
    path = "/api/v1/admin/categories/order",
    tag = "admin",
    security(
        ("bearer_auth" = [])
    ),
    request_body = CategoryOrderUpdate,
    responses(
        (status = 200, description = "순서 변경 성공", body = Vec<CategoryResponse>),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "Admin 권한 필요"),
        (status = 400, description = "잘못된 요청")
    )
)]
pub async fn update_category_order(
    State(state): State<AppState>,
    _extension: axum::Extension<User>, // Admin 미들웨어에서 이미 검증됨
    Json(dto): Json<CategoryOrderUpdate>,
) -> AppResult<Json<Vec<CategoryResponse>>> {
    let categories = crate::domains::categories::service::admin_update_category_order(
        state.db.as_ref(),
        dto.orders,
    )
    .await?;
    Ok(Json(categories))
}

/// PATCH /api/v1/admin/categories/{id}/status - 카테고리 활성화/비활성화
#[utoipa::path(
    patch,
    path = "/api/v1/admin/categories/{id}/status",
    tag = "admin",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("id" = Uuid, Path, description = "Category ID")
    ),
    request_body = CategoryStatusUpdate,
    responses(
        (status = 200, description = "상태 변경 성공", body = CategoryResponse),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "Admin 권한 필요"),
        (status = 404, description = "카테고리를 찾을 수 없음")
    )
)]
pub async fn update_category_status(
    State(state): State<AppState>,
    _extension: axum::Extension<User>, // Admin 미들웨어에서 이미 검증됨
    Path(category_id): Path<Uuid>,
    Json(dto): Json<CategoryStatusUpdate>,
) -> AppResult<Json<CategoryResponse>> {
    let category = crate::domains::categories::service::admin_update_category_status(
        state.db.as_ref(),
        category_id,
        dto.is_active,
    )
    .await?;
    Ok(Json(category))
}

/// Admin Categories 라우터
pub fn router(app_config: AppConfig) -> Router<AppState> {
    Router::new()
        .route("/", post(create_category))
        .route("/{id}", patch(update_category))
        .route("/order", put(update_category_order))
        .route("/{id}/status", patch(update_category_status))
        .layer(axum::middleware::from_fn_with_state(
            app_config.clone(),
            crate::middleware::auth_middleware,
        ))
        .layer(axum::middleware::from_fn(
            crate::middleware::admin_middleware,
        ))
}
