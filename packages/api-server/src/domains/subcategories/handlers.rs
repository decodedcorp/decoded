//! Subcategories handlers

use axum::{
    extract::{Path, State},
    routing::get,
    Json, Router,
};
use uuid::Uuid;

use crate::{config::AppState, error::AppResult};

use super::{
    dto::{CategoryWithSubcategories, SubcategoryResponse},
    service,
};

/// Subcategories 라우터
pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(get_all_subcategories))
        .route("/{category_id}", get(get_subcategories_by_category))
}

/// 모든 Subcategories 조회 (Category별 그룹화)
///
/// GET /api/v1/subcategories
#[utoipa::path(
    get,
    path = "/api/v1/subcategories",
    tag = "subcategories",
    responses(
        (status = 200, description = "Subcategories list grouped by category", body = Vec<CategoryWithSubcategories>),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn get_all_subcategories(
    State(state): State<AppState>,
) -> AppResult<Json<Vec<CategoryWithSubcategories>>> {
    let result = service::list_all_with_categories(state.db.as_ref()).await?;
    Ok(Json(result))
}

/// 특정 카테고리의 Subcategories 조회
///
/// GET /api/v1/subcategories/:category_id
#[utoipa::path(
    get,
    path = "/api/v1/subcategories/{category_id}",
    tag = "subcategories",
    params(
        ("category_id" = Uuid, Path, description = "Category ID")
    ),
    responses(
        (status = 200, description = "Subcategories list", body = Vec<SubcategoryResponse>),
        (status = 404, description = "Category not found"),
        (status = 500, description = "Internal server error")
    )
)]
pub async fn get_subcategories_by_category(
    State(state): State<AppState>,
    Path(category_id): Path<Uuid>,
) -> AppResult<Json<Vec<SubcategoryResponse>>> {
    let result = service::list_subcategories_by_category(state.db.as_ref(), category_id).await?;
    Ok(Json(result))
}
