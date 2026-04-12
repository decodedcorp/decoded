//! Spots API handlers
//!
//! Spot 관련 HTTP 엔드포인트

use axum::{
    extract::{Path, Query, State},
    middleware::from_fn_with_state,
    routing::{get, patch, post},
    Extension, Json, Router,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    config::{AppConfig, AppState},
    error::{AppError, AppResult},
    middleware::{auth::User, auth_middleware, optional_auth_middleware},
};

use super::{
    dto::{CreateSpotDto, SpotListItem, SpotResponse, SpotsByPostsResponse, UpdateSpotDto},
    service,
};

/// POST /api/v1/posts/{post_id}/spots - Spot 추가
#[utoipa::path(
    post,
    path = "/api/v1/posts/{post_id}/spots",
    tag = "spots",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("post_id" = Uuid, Path, description = "Post ID")
    ),
    request_body = CreateSpotDto,
    responses(
        (status = 201, description = "Spot 생성 성공", body = SpotResponse),
        (status = 401, description = "인증 필요"),
        (status = 404, description = "Post를 찾을 수 없음")
    )
)]
pub async fn create_spot(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Path(post_id): Path<Uuid>,
    Json(dto): Json<CreateSpotDto>,
) -> AppResult<Json<SpotResponse>> {
    // Post 존재 확인
    crate::domains::posts::service::get_post_by_id(state.db.as_ref(), post_id).await?;

    let spot = service::create_spot(state.db.as_ref(), post_id, user.id, dto).await?;
    Ok(Json(spot))
}

/// GET /api/v1/posts/{post_id}/spots - Spot 목록 조회
#[utoipa::path(
    get,
    path = "/api/v1/posts/{post_id}/spots",
    tag = "spots",
    params(
        ("post_id" = Uuid, Path, description = "Post ID")
    ),
    responses(
        (status = 200, description = "Spot 목록 조회 성공", body = Vec<SpotListItem>),
        (status = 404, description = "Post를 찾을 수 없음")
    )
)]
pub async fn list_spots(
    State(state): State<AppState>,
    Path(post_id): Path<Uuid>,
) -> AppResult<Json<Vec<SpotListItem>>> {
    // Post 존재 확인
    crate::domains::posts::service::get_post_by_id(state.db.as_ref(), post_id).await?;

    let spots = service::list_spots_by_post_id(state.db.as_ref(), post_id).await?;
    Ok(Json(spots))
}

/// GET /api/v1/spots/{spot_id} - Spot 상세 조회
#[utoipa::path(
    get,
    path = "/api/v1/spots/{spot_id}",
    tag = "spots",
    params(
        ("spot_id" = Uuid, Path, description = "Spot ID")
    ),
    responses(
        (status = 200, description = "Spot 상세 조회 성공", body = SpotResponse),
        (status = 404, description = "Spot을 찾을 수 없음")
    )
)]
pub async fn get_spot(
    State(state): State<AppState>,
    Path(spot_id): Path<Uuid>,
    user: Option<Extension<User>>,
) -> AppResult<Json<SpotResponse>> {
    let spot = service::get_spot_by_id(state.db.as_ref(), spot_id).await?;

    // 로그인한 사용자의 경우 view_logs 기록
    if let Some(Extension(user)) = user {
        let _ = crate::domains::views::service::create_view_log(
            state.db.as_ref(),
            user.id,
            "spot",
            spot_id,
        )
        .await;
    }

    // 카테고리 정보 조회
    let category = if let Some(subcategory_id) = spot.subcategory_id {
        Some(
            crate::domains::spots::service::get_category_from_spot(
                state.db.as_ref(),
                subcategory_id,
            )
            .await?,
        )
    } else {
        None
    };

    Ok(Json(SpotResponse {
        id: spot.id,
        post_id: spot.post_id,
        user_id: spot.user_id,
        position_left: spot.position_left,
        position_top: spot.position_top,
        category,
        status: spot.status,
        created_at: spot.created_at.with_timezone(&chrono::Utc),
    }))
}

/// PATCH /api/v1/spots/{spot_id} - Spot 수정
#[utoipa::path(
    patch,
    path = "/api/v1/spots/{spot_id}",
    tag = "spots",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("spot_id" = Uuid, Path, description = "Spot ID")
    ),
    request_body = UpdateSpotDto,
    responses(
        (status = 200, description = "Spot 수정 성공", body = SpotResponse),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "권한 없음"),
        (status = 404, description = "Spot을 찾을 수 없음")
    )
)]
pub async fn update_spot(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Path(spot_id): Path<Uuid>,
    Json(dto): Json<UpdateSpotDto>,
) -> AppResult<Json<SpotResponse>> {
    let updated_spot = service::update_spot(state.db.as_ref(), spot_id, user.id, dto).await?;
    Ok(Json(updated_spot))
}

/// 배치 조회 쿼리: `post_ids=uuid1,uuid2,...`
#[derive(Debug, Deserialize)]
pub struct SpotsByPostsQuery {
    pub post_ids: String,
    /// spot 당 노출할 solution 수 (기본 3, 상한 5)
    pub solutions_per_spot: Option<usize>,
}

/// GET /api/v1/spots/by-posts?post_ids=a,b,c
///
/// 여러 post_id 에 대한 spots + 대표 solutions 을 한 번에 반환한다.
/// 홈 페이지 hero/editorial 카드의 아이템 오버레이 배치 조회용.
#[utoipa::path(
    get,
    path = "/api/v1/spots/by-posts",
    tag = "spots",
    params(
        ("post_ids" = String, Query, description = "comma-separated post uuids (max 50)"),
        ("solutions_per_spot" = Option<usize>, Query, description = "상위 solution 개수 (default 3, max 5)"),
    ),
    responses(
        (status = 200, description = "조회 성공", body = SpotsByPostsResponse),
        (status = 400, description = "잘못된 post_ids")
    )
)]
pub async fn list_spots_by_posts(
    State(state): State<AppState>,
    Query(q): Query<SpotsByPostsQuery>,
) -> AppResult<Json<SpotsByPostsResponse>> {
    let post_ids: Vec<Uuid> = q
        .post_ids
        .split(',')
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(Uuid::parse_str)
        .collect::<Result<Vec<_>, _>>()
        .map_err(|_| AppError::validation("post_ids must be comma-separated uuids"))?;
    if post_ids.len() > 50 {
        return Err(AppError::validation("post_ids supports at most 50 entries"));
    }
    let solutions_per_spot = q.solutions_per_spot.unwrap_or(3).clamp(1, 5);
    let result =
        service::list_spots_by_posts(state.db.as_ref(), &post_ids, solutions_per_spot).await?;
    Ok(Json(result))
}

/// DELETE /api/v1/spots/{spot_id} - Spot 삭제
#[utoipa::path(
    delete,
    path = "/api/v1/spots/{spot_id}",
    tag = "spots",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("spot_id" = Uuid, Path, description = "Spot ID")
    ),
    responses(
        (status = 204, description = "Spot 삭제 성공"),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "권한 없음"),
        (status = 404, description = "Spot을 찾을 수 없음")
    )
)]
pub async fn delete_spot(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Path(spot_id): Path<Uuid>,
) -> AppResult<axum::http::StatusCode> {
    service::delete_spot(state.db.as_ref(), spot_id, user.id).await?;
    Ok(axum::http::StatusCode::NO_CONTENT)
}

/// Spots 도메인 라우터
/// Note: /posts/{post_id}/spots 경로에서 사용됨
pub fn router(app_config: AppConfig) -> Router<AppState> {
    let protected_routes = Router::new()
        .route("/", post(create_spot))
        .route("/{spot_id}", patch(update_spot).delete(delete_spot))
        .route_layer(from_fn_with_state(app_config.clone(), auth_middleware));

    // optional auth가 필요한 라우트 (조회 로그 기록용)
    let optional_auth_routes = Router::new()
        .route("/{spot_id}", get(get_spot))
        .route_layer(from_fn_with_state(app_config, optional_auth_middleware));

    Router::new()
        .route("/", get(list_spots))
        .route("/by-posts", get(list_spots_by_posts))
        .route(
            "/{spot_id}/tries",
            get(crate::domains::posts::handlers::list_tries_by_spot),
        )
        .merge(optional_auth_routes)
        .merge(protected_routes)
}

#[cfg(test)]
#[allow(clippy::disallowed_methods)]
mod tests {
    // Note: API 핸들러 테스트는 통합 테스트에서 수행
}
