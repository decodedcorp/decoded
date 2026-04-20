use axum::{extract::State, routing::post, Extension, Json, Router};

use crate::{
    config::{AppConfig, AppState},
    error::AppResult,
    middleware::auth::User,
};

use super::{
    dto::{EventItem, IngestEventsResponse},
    service,
};

/// POST /api/v1/events — behavioral event batch ingest.
///
/// 인증된 유저만 허용 (middleware 가 401 처리).
/// user_id 는 서버 주입 (JWT 의 User.id) — client 가 지정한 값 무시.
/// 빈 배열은 200 OK + accepted=0.
#[utoipa::path(
    post,
    path = "/api/v1/events",
    operation_id = "events_ingest",
    tag = "events",
    security(("bearer_auth" = [])),
    request_body = Vec<EventItem>,
    responses(
        (status = 200, description = "수락된 이벤트 수", body = IngestEventsResponse),
        (status = 400, description = "배치 크기 초과 등"),
        (status = 401, description = "인증 필요")
    )
)]
pub async fn ingest_events(
    State(state): State<AppState>,
    Extension(user): Extension<User>,
    Json(events): Json<Vec<EventItem>>,
) -> AppResult<Json<IngestEventsResponse>> {
    let accepted = service::insert_events(state.db.as_ref(), user.id, events).await?;
    Ok(Json(IngestEventsResponse { ok: true, accepted }))
}

pub fn router(app_config: AppConfig) -> Router<AppState> {
    Router::new()
        .route("/", post(ingest_events))
        .layer(axum::middleware::from_fn_with_state(
            app_config,
            crate::middleware::auth_middleware,
        ))
}
