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

use super::dto::{SavedPostResponse, SavedPostStatsResponse};
use super::service;

pub async fn save_post(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Path(post_id): Path<Uuid>,
) -> AppResult<impl IntoResponse> {
    let saved = service::save_post(state.db.as_ref(), post_id, user.id).await?;

    let response = SavedPostResponse {
        id: saved.id,
        post_id: saved.post_id,
        user_id: saved.user_id,
        created_at: saved.created_at.to_utc(),
    };

    Ok((StatusCode::CREATED, Json(response)))
}

pub async fn unsave_post(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Path(post_id): Path<Uuid>,
) -> AppResult<impl IntoResponse> {
    service::unsave_post(state.db.as_ref(), post_id, user.id).await?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn get_save_status(
    State(state): State<AppState>,
    Path(post_id): Path<Uuid>,
    user: Option<Extension<User>>,
) -> AppResult<impl IntoResponse> {
    let user_has_saved = if let Some(Extension(u)) = user {
        service::user_has_saved(state.db.as_ref(), post_id, u.id).await?
    } else {
        false
    };

    Ok(Json(SavedPostStatsResponse { user_has_saved }))
}

pub fn router(app_config: AppConfig) -> Router<AppState> {
    use crate::middleware::auth_middleware;

    let protected = Router::new()
        .route(
            "/posts/{post_id}/saved",
            post(save_post).delete(unsave_post),
        )
        .route_layer(from_fn_with_state(app_config, auth_middleware));

    Router::new()
        .route("/posts/{post_id}/saved", get(get_save_status))
        .merge(protected)
}
