use crate::config::{AppConfig, AppState};
use crate::error::AppResult;
use crate::middleware::auth::User;
use axum::{
    extract::{Path, State},
    http::StatusCode,
    middleware::from_fn_with_state,
    response::IntoResponse,
    routing::{get, post},
    Extension, Json, Router,
};
use uuid::Uuid;
use validator::Validate;

use super::dto::{AdoptResponse, AdoptSolutionDto, CreateVoteDto, VoteResponse, VoteStatsResponse};
use super::service;

/// 투표하기
#[utoipa::path(
    post,
    path = "/api/v1/solutions/{solution_id}/votes",
    tag = "votes",
    params(
        ("solution_id" = Uuid, Path, description = "Solution ID")
    ),
    request_body = CreateVoteDto,
    responses(
        (status = 201, description = "투표 성공", body = VoteResponse),
        (status = 400, description = "이미 투표함"),
        (status = 401, description = "인증 필요"),
        (status = 404, description = "Solution을 찾을 수 없음")
    ),
    security(
        ("bearer" = [])
    )
)]
pub async fn create_vote(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Path(solution_id): Path<Uuid>,
    Json(dto): Json<CreateVoteDto>,
) -> AppResult<impl IntoResponse> {
    dto.validate()?;

    let vote = service::create_vote(&state.db, solution_id, user.id, dto.vote_type.clone()).await?;

    let response = VoteResponse {
        id: vote.id,
        solution_id: vote.solution_id,
        user_id: vote.user_id,
        vote_type: dto.vote_type,
        created_at: vote.created_at.to_utc(),
    };

    Ok((StatusCode::CREATED, Json(response)))
}

/// 투표 취소
#[utoipa::path(
    delete,
    path = "/api/v1/solutions/{solution_id}/votes",
    tag = "votes",
    params(
        ("solution_id" = Uuid, Path, description = "Solution ID")
    ),
    responses(
        (status = 204, description = "투표 취소 성공"),
        (status = 401, description = "인증 필요"),
        (status = 404, description = "투표를 찾을 수 없음")
    ),
    security(
        ("bearer" = [])
    )
)]
pub async fn delete_vote(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Path(solution_id): Path<Uuid>,
) -> AppResult<impl IntoResponse> {
    service::delete_vote(&state.db, solution_id, user.id).await?;

    Ok(StatusCode::NO_CONTENT)
}

/// 투표 현황 조회
#[utoipa::path(
    get,
    path = "/api/v1/solutions/{solution_id}/votes",
    tag = "votes",
    params(
        ("solution_id" = Uuid, Path, description = "Solution ID")
    ),
    responses(
        (status = 200, description = "투표 현황 조회 성공", body = VoteStatsResponse),
        (status = 404, description = "Solution을 찾을 수 없음")
    )
)]
pub async fn get_vote_stats(
    State(state): State<AppState>,
    Path(solution_id): Path<Uuid>,
    user: Option<Extension<User>>,
) -> AppResult<impl IntoResponse> {
    let user_id = user.map(|u| u.id);
    let stats = service::get_vote_stats(&state.db, solution_id, user_id).await?;

    Ok(Json(stats))
}

/// Solution 채택 (Spotter만)
#[utoipa::path(
    post,
    path = "/api/v1/solutions/{solution_id}/adopt",
    tag = "votes",
    params(
        ("solution_id" = Uuid, Path, description = "Solution ID")
    ),
    request_body = AdoptSolutionDto,
    responses(
        (status = 200, description = "채택 성공", body = AdoptResponse),
        (status = 400, description = "이미 다른 Solution이 채택됨"),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "Spot 작성자만 채택 가능"),
        (status = 404, description = "Solution을 찾을 수 없음")
    ),
    security(
        ("bearer" = [])
    )
)]
pub async fn adopt_solution(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Path(solution_id): Path<Uuid>,
    Json(dto): Json<AdoptSolutionDto>,
) -> AppResult<impl IntoResponse> {
    dto.validate()?;

    let response = service::adopt_solution(&state.db, solution_id, user.id, dto.match_type).await?;

    Ok(Json(response))
}

/// 채택 취소
#[utoipa::path(
    delete,
    path = "/api/v1/solutions/{solution_id}/adopt",
    tag = "votes",
    params(
        ("solution_id" = Uuid, Path, description = "Solution ID")
    ),
    responses(
        (status = 204, description = "채택 취소 성공"),
        (status = 401, description = "인증 필요"),
        (status = 403, description = "Spot 작성자만 취소 가능"),
        (status = 404, description = "Solution을 찾을 수 없음")
    ),
    security(
        ("bearer" = [])
    )
)]
pub async fn unadopt_solution(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Path(solution_id): Path<Uuid>,
) -> AppResult<impl IntoResponse> {
    service::unadopt_solution(&state.db, solution_id, user.id).await?;

    Ok(StatusCode::NO_CONTENT)
}

/// Votes 라우터 (api_router가 /api/v1 아래에 nest되므로 prefix 제외)
pub fn router(app_config: AppConfig) -> Router<AppState> {
    use crate::middleware::auth_middleware;

    let protected_votes = Router::new()
        .route(
            "/solutions/{solution_id}/votes",
            post(create_vote).delete(delete_vote),
        )
        .route_layer(from_fn_with_state(app_config.clone(), auth_middleware));

    let protected_adopt = Router::new()
        .route(
            "/solutions/{solution_id}/adopt",
            post(adopt_solution).delete(unadopt_solution),
        )
        .route_layer(from_fn_with_state(app_config, auth_middleware));

    Router::new()
        .route("/solutions/{solution_id}/votes", get(get_vote_stats))
        .merge(protected_votes)
        .merge(protected_adopt)
}
