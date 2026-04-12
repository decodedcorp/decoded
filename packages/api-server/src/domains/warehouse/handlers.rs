//! Warehouse handlers

use axum::{
    extract::{Query, State},
    routing::get,
    Json, Router,
};
use serde::Deserialize;

use crate::{config::AppState, error::AppResult};

use super::{dto::WarehouseProfilesResponse, service};

#[derive(Debug, Clone, Deserialize)]
pub struct ProfilesQuery {
    /// 각 테이블에서 가져올 최대 행 수 (기본 500, 상한 2000).
    pub limit: Option<u64>,
}

/// GET /api/v1/warehouse/profiles
///
/// warehouse.artists + warehouse.groups 프로필을 한 번에 반환한다.
/// 홈 페이지의 이름 → 프로필 매핑을 빌드하는 용도.
#[utoipa::path(
    get,
    path = "/api/v1/warehouse/profiles",
    params(
        ("limit" = Option<u64>, Query, description = "각 엔티티 최대 개수 (default 500)"),
    ),
    responses(
        (status = 200, description = "프로필 조회 성공", body = WarehouseProfilesResponse),
        (status = 500, description = "서버 오류"),
    ),
    tag = "warehouse"
)]
pub async fn get_profiles(
    State(state): State<AppState>,
    Query(q): Query<ProfilesQuery>,
) -> AppResult<Json<WarehouseProfilesResponse>> {
    let limit = service::clamp_limit(q.limit);
    let result = service::list_profiles(state.db.as_ref(), limit).await?;
    Ok(Json(result))
}

/// Warehouse 도메인 라우터
pub fn router() -> Router<AppState> {
    Router::new().route("/profiles", get(get_profiles))
}
