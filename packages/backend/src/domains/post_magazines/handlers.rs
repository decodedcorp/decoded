use axum::{
    extract::{Path, State},
    routing::{get, post},
    Json, Router,
};
use uuid::Uuid;

use crate::{config::AppState, error::AppResult};

use super::{
    dto::{GeneratePostMagazineRequest, GeneratePostMagazineResponse, PostMagazineResponse},
    service,
};

pub async fn generate(
    State(state): State<AppState>,
    Json(body): Json<GeneratePostMagazineRequest>,
) -> AppResult<Json<GeneratePostMagazineResponse>> {
    let magazine_id =
        service::generate_post_magazine(&state.db, state.decoded_ai_client.as_ref(), body.post_id)
            .await?;

    Ok(Json(GeneratePostMagazineResponse {
        post_magazine_id: magazine_id,
        status: "generating".to_string(),
    }))
}

pub async fn get_magazine(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> AppResult<Json<PostMagazineResponse>> {
    let response = service::get_post_magazine(&state.db, id).await?;
    Ok(Json(response))
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/generate", post(generate))
        .route("/{id}", get(get_magazine))
}
