//! Admin Spots (재태깅)

use axum::{
    extract::{Path, Query, State},
    routing::{get, patch},
    Json, Router,
};
use serde::Deserialize;
use utoipa::ToSchema;
use uuid::Uuid;

use crate::{
    config::{AppConfig, AppState},
    domains::spots::{
        dto::{AdminSpotSubcategoryUpdate, SpotResponse},
        service,
    },
    error::AppResult,
    middleware::auth::User,
    utils::pagination::{PaginatedResponse, Pagination},
};

#[derive(Debug, Clone, Deserialize, ToSchema)]
pub struct AdminSpotListQuery {
    /// 필터: 해당 서브카테고리만 (미분류 큐는 `uncategorized` UUID)
    #[serde(default)]
    pub subcategory_id: Option<Uuid>,
    #[serde(flatten)]
    pub pagination: Pagination,
}

/// GET /api/v1/admin/spots
#[utoipa::path(
    get,
    path = "/api/v1/admin/spots",
    operation_id = "admin_list_spots",
    tag = "admin",
    security(("bearer_auth" = [])),
    params(
        ("subcategory_id" = Option<Uuid>, Query, description = "Subcategory filter"),
        ("page" = Option<u64>, Query),
        ("per_page" = Option<u64>, Query),
    ),
    responses(
        (status = 200, description = "Spot list", body = PaginatedResponse<crate::domains::spots::dto::AdminSpotListItem>),
        (status = 401, description = "Unauthorized"),
        (status = 403, description = "Admin required"),
    )
)]
pub async fn list_spots(
    State(state): State<AppState>,
    _extension: axum::Extension<User>,
    Query(query): Query<AdminSpotListQuery>,
) -> AppResult<Json<PaginatedResponse<crate::domains::spots::dto::AdminSpotListItem>>> {
    let res = service::admin_list_spots(state.db.as_ref(), query.subcategory_id, query.pagination)
        .await?;
    Ok(Json(res))
}

/// PATCH /api/v1/admin/spots/{id}/subcategory
#[utoipa::path(
    patch,
    path = "/api/v1/admin/spots/{id}/subcategory",
    tag = "admin",
    security(("bearer_auth" = [])),
    params(("id" = Uuid, Path, description = "Spot ID")),
    request_body = AdminSpotSubcategoryUpdate,
    responses(
        (status = 200, description = "Updated", body = SpotResponse),
        (status = 400, description = "Bad request"),
        (status = 404, description = "Not found"),
    )
)]
pub async fn update_spot_subcategory(
    State(state): State<AppState>,
    _extension: axum::Extension<User>,
    Path(spot_id): Path<Uuid>,
    Json(dto): Json<AdminSpotSubcategoryUpdate>,
) -> AppResult<Json<SpotResponse>> {
    let spot = service::admin_update_spot_subcategory(state.db.as_ref(), spot_id, dto).await?;
    Ok(Json(spot))
}

pub fn router(app_config: AppConfig) -> Router<AppState> {
    Router::new()
        .route("/", get(list_spots))
        .route("/{id}/subcategory", patch(update_spot_subcategory))
        .layer(axum::middleware::from_fn_with_state(
            app_config.clone(),
            crate::middleware::auth_middleware,
        ))
        .layer(axum::middleware::from_fn(
            crate::middleware::admin_middleware,
        ))
}
