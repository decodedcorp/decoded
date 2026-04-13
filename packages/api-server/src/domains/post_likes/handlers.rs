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

use super::dto::PostLikeResponse;
use super::service;

pub async fn create_like(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Path(post_id): Path<Uuid>,
) -> AppResult<impl IntoResponse> {
    let like = service::create_like(state.db.as_ref(), post_id, user.id).await?;

    let response = PostLikeResponse {
        id: like.id,
        post_id: like.post_id,
        user_id: like.user_id,
        created_at: like.created_at.to_utc(),
    };

    Ok((StatusCode::CREATED, Json(response)))
}

pub async fn delete_like(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Path(post_id): Path<Uuid>,
) -> AppResult<impl IntoResponse> {
    service::delete_like(state.db.as_ref(), post_id, user.id).await?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn get_like_stats(
    State(state): State<AppState>,
    Path(post_id): Path<Uuid>,
    user: Option<Extension<User>>,
) -> AppResult<impl IntoResponse> {
    let user_id = user.map(|u| u.id);
    let stats = service::get_like_stats(state.db.as_ref(), post_id, user_id).await?;

    Ok(Json(stats))
}

pub fn router(app_config: AppConfig) -> Router<AppState> {
    use crate::middleware::auth_middleware;

    let protected = Router::new()
        .route(
            "/posts/{post_id}/likes",
            post(create_like).delete(delete_like),
        )
        .route_layer(from_fn_with_state(app_config, auth_middleware));

    Router::new()
        .route("/posts/{post_id}/likes", get(get_like_stats))
        .merge(protected)
}
