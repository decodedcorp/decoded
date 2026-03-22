//! Categories API handlers
//!
//! 카테고리 관련 HTTP 엔드포인트

use axum::{extract::State, routing::get, Json, Router};

use crate::{config::AppState, error::AppResult};

use super::{dto::CategoryResponse, service};

/// GET /api/v1/categories - 카테고리 목록 조회 (공개)
#[utoipa::path(
    get,
    path = "/api/v1/categories",
    tag = "categories",
    responses(
        (status = 200, description = "카테고리 목록 조회 성공", body = Vec<CategoryResponse>),
        (status = 500, description = "서버 오류")
    )
)]
pub async fn get_categories(
    State(state): State<AppState>,
) -> AppResult<Json<Vec<CategoryResponse>>> {
    let categories = service::list_active_categories(&state.db).await?;
    Ok(Json(categories))
}

/// Categories 도메인 라우터
pub fn router() -> Router<AppState> {
    Router::new().route("/", get(get_categories))
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    // Note: API 핸들러 테스트는 통합 테스트에서 수행
}
