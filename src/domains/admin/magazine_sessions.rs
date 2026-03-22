//! Admin Magazine Sessions 관리
//!
//! 매거진 편집 세션 CRUD (목록, 상세, 생성, 삭제)
//!
//! `serde_json::json!` 매크로 전개에 `unwrap`이 포함되어 Clippy와 충돌합니다.
#![allow(clippy::disallowed_methods)]

use axum::{
    extract::{FromRequest, Path, Request, State},
    routing::get,
    Extension, Json, Router,
};
use axum_extra::extract::Multipart;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, QueryOrder, QuerySelect};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use crate::{
    config::{AppConfig, AppState},
    entities::{agent_sessions, AgentSessions},
    error::{AppError, AppResult},
    middleware::auth::User,
};

#[derive(Deserialize)]
struct CreateSessionJsonDto {
    topic: String,
    images: Vec<ImageB64>,
}

#[derive(Deserialize)]
struct ImageB64 {
    b64: String,
    #[serde(default)]
    mime_type: String,
    #[serde(default)]
    filename: String,
}

const MAGAZINE_BUCKET: &str = "magazine-images";
const ALLOWED_EXT: [&str; 4] = [".jpg", ".jpeg", ".png", ".webp"];
const EXT_MIME: [(&str, &str); 4] = [
    (".jpg", "image/jpeg"),
    (".jpeg", "image/jpeg"),
    (".png", "image/png"),
    (".webp", "image/webp"),
];

async fn parse_multipart(multipart: &mut Multipart) -> AppResult<(String, Vec<serde_json::Value>)> {
    let mut topic = String::new();
    let mut images_b64: Vec<serde_json::Value> = vec![];

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| AppError::BadRequest(format!("Failed to parse multipart: {}", e)))?
    {
        let name = field.name().unwrap_or("");

        if name == "topic" {
            if let Ok(t) = field.text().await {
                topic = t;
            }
        } else if name == "images" {
            let filename = field
                .file_name()
                .map(|s| s.to_string())
                .unwrap_or_else(|| "image.png".to_string());
            let ext = std::path::Path::new(&filename)
                .extension()
                .and_then(|e| e.to_str())
                .map(|s| format!(".{}", s.to_lowercase()))
                .unwrap_or_else(|| ".png".to_string());

            if !ALLOWED_EXT.contains(&ext.as_str()) {
                continue;
            }

            let mime = EXT_MIME
                .iter()
                .find(|(e, _)| *e == ext)
                .map(|(_, m)| *m)
                .unwrap_or("image/png");

            if let Ok(data) = field.bytes().await {
                let data = data.to_vec();
                if !data.is_empty() {
                    let b64 =
                        base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &data);
                    images_b64.push(json!({
                        "b64": b64,
                        "mime_type": mime,
                        "filename": filename,
                    }));
                }
            }
        }
    }
    Ok((topic, images_b64))
}

fn empty_metadata() -> serde_json::Value {
    json!({
        "topic": "",
        "current_step": "vision",
        "step_status": "pending_confirm",
        "image_urls": [],
        "images_b64": [],
        "images_json": [],
        "outline": {},
        "external_solutions": [],
        "sections": [],
        "layout_spec": {},
        "revision_history": [],
    })
}

/// GET /api/v1/admin/magazine-sessions - 세션 목록
pub async fn list_sessions(
    State(state): State<AppState>,
    _extension: axum::Extension<User>,
) -> AppResult<Json<SessionListResponse>> {
    let rows = AgentSessions::find()
        .filter(agent_sessions::Column::ThreadId.like("mag-%"))
        .order_by_desc(agent_sessions::Column::CreatedAt)
        .limit(50)
        .all(&state.db)
        .await?;

    let empty = serde_json::Map::new();
    let sessions: Vec<SessionListItem> = rows
        .into_iter()
        .map(|r| {
            let meta = r
                .metadata
                .as_ref()
                .and_then(|v| v.as_object())
                .unwrap_or(&empty);
            SessionListItem {
                id: r.id,
                thread_id: r.thread_id,
                magazine_id: r.magazine_id,
                topic: meta
                    .get("topic")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string(),
                current_step: meta
                    .get("current_step")
                    .and_then(|v| v.as_str())
                    .unwrap_or("vision")
                    .to_string(),
                created_at: r.created_at,
            }
        })
        .collect();

    Ok(Json(SessionListResponse { sessions }))
}

/// GET /api/v1/admin/magazine-sessions/:id - 세션 상세
pub async fn get_session(
    State(state): State<AppState>,
    _extension: axum::Extension<User>,
    Path(session_id): Path<Uuid>,
) -> AppResult<Json<SessionDetailResponse>> {
    let row = AgentSessions::find_by_id(session_id)
        .one(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Session not found".to_string()))?;

    let empty = serde_json::Map::new();
    let meta = row
        .metadata
        .as_ref()
        .and_then(|v| v.as_object())
        .unwrap_or(&empty);
    let images_b64 = meta
        .get("images_b64")
        .and_then(|v| v.as_array())
        .map(|a| a.len())
        .unwrap_or(0);

    Ok(Json(SessionDetailResponse {
        id: row.id,
        thread_id: row.thread_id,
        magazine_id: row.magazine_id,
        topic: meta
            .get("topic")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        image_count: images_b64,
        image_urls: meta
            .get("image_urls")
            .and_then(|v| v.as_array())
            .map(|a| {
                a.iter()
                    .filter_map(|v| v.as_str().map(String::from))
                    .collect()
            })
            .unwrap_or_default(),
        cropped_image_urls: meta
            .get("cropped_image_urls")
            .and_then(|v| v.as_array())
            .map(|a| {
                a.iter()
                    .filter_map(|v| v.as_str().map(String::from))
                    .collect()
            })
            .unwrap_or_default(),
        current_step: meta
            .get("current_step")
            .and_then(|v| v.as_str())
            .unwrap_or("vision")
            .to_string(),
        step_status: meta
            .get("step_status")
            .and_then(|v| v.as_str())
            .unwrap_or("pending_confirm")
            .to_string(),
        step_error: meta
            .get("step_error")
            .and_then(|v| v.as_str())
            .map(String::from),
        writer_headline: meta
            .get("writer_headline")
            .and_then(|v| v.as_str())
            .map(String::from),
        writer_subheadline: meta
            .get("writer_subheadline")
            .and_then(|v| v.as_str())
            .map(String::from),
        writer_standfirst: meta
            .get("writer_standfirst")
            .and_then(|v| v.as_str())
            .map(String::from),
        images_json: meta.get("images_json").cloned().unwrap_or(json!([])),
        outline: meta.get("outline").cloned().unwrap_or(json!({})),
        outline_prev: meta.get("outline_prev").cloned(),
        sections: meta.get("sections").cloned().unwrap_or(json!([])),
        layout_spec: meta.get("layout_spec").cloned().unwrap_or(json!({})),
        external_solutions: meta.get("external_solutions").cloned().unwrap_or(json!([])),
        revision_history: meta.get("revision_history").cloned().unwrap_or(json!([])),
    }))
}

/// POST /api/v1/admin/magazine-sessions - 세션 생성
/// Content-Type: application/json (topic + images base64) 또는 multipart/form-data 지원
pub async fn create_session(
    State(state): State<AppState>,
    Extension(user): axum::Extension<User>,
    request: Request,
) -> AppResult<Json<CreateSessionResponse>> {
    let (topic, images_b64) = {
        let content_type = request
            .headers()
            .get("content-type")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("");

        if content_type.contains("application/json") {
            let body = axum::body::to_bytes(request.into_body(), 30_000_000)
                .await
                .map_err(|e| AppError::BadRequest(format!("Failed to read body: {}", e)))?;
            let dto: CreateSessionJsonDto = serde_json::from_slice(&body)
                .map_err(|e| AppError::BadRequest(format!("Invalid JSON: {}", e)))?;
            let images_b64: Vec<serde_json::Value> = dto
                .images
                .into_iter()
                .map(|img| {
                    json!({
                        "b64": img.b64,
                        "mime_type": if img.mime_type.is_empty() { "image/png".to_string() } else { img.mime_type },
                        "filename": if img.filename.is_empty() { "image.png".to_string() } else { img.filename },
                    })
                })
                .collect();
            (dto.topic, images_b64)
        } else {
            let mut multipart = Multipart::from_request(request, &())
                .await
                .map_err(|e| AppError::BadRequest(format!("Failed to parse multipart: {}", e)))?;
            parse_multipart(&mut multipart).await?
        }
    };

    let thread_id = format!("mag-{}", Uuid::new_v4());
    let mut metadata = empty_metadata();
    if let Some(obj) = metadata.as_object_mut() {
        obj.insert("topic".to_string(), json!(topic));
        obj.insert("images_b64".to_string(), json!(images_b64));
        obj.insert("current_step".to_string(), json!("vision"));
        obj.insert("step_status".to_string(), json!("pending_confirm"));
    }

    let active = agent_sessions::ActiveModel {
        id: sea_orm::ActiveValue::NotSet,
        thread_id: sea_orm::ActiveValue::Set(thread_id.clone()),
        magazine_id: sea_orm::ActiveValue::Set(None),
        user_id: sea_orm::ActiveValue::Set(user.id),
        status: sea_orm::ActiveValue::Set("active".to_string()),
        keywords: sea_orm::ActiveValue::Set(Some(json!([topic]))),
        metadata: sea_orm::ActiveValue::Set(Some(metadata)),
        created_at: sea_orm::ActiveValue::NotSet,
        updated_at: sea_orm::ActiveValue::NotSet,
    };

    let result = active.insert(&state.db).await?;

    Ok(Json(CreateSessionResponse {
        session_id: result.id,
        thread_id: result.thread_id,
        image_count: images_b64.len(),
    }))
}

/// DELETE /api/v1/admin/magazine-sessions/:id - 세션 삭제
pub async fn delete_session(
    State(state): State<AppState>,
    _extension: axum::Extension<User>,
    Path(session_id): Path<Uuid>,
) -> AppResult<Json<DeleteSessionResponse>> {
    let row = AgentSessions::find_by_id(session_id)
        .one(&state.db)
        .await?
        .ok_or_else(|| AppError::NotFound("Session not found".to_string()))?;

    delete_session_storage(&state.config, session_id, row.metadata.as_ref()).await;

    AgentSessions::delete_by_id(session_id)
        .exec(&state.db)
        .await?;

    Ok(Json(DeleteSessionResponse {
        deleted: true,
        session_id,
    }))
}

async fn delete_session_storage(
    config: &crate::config::AppConfig,
    session_id: Uuid,
    metadata: Option<&serde_json::Value>,
) {
    let url = config.auth.supabase_url.trim_end_matches('/');
    let key = &config.auth.supabase_service_role_key;
    if url.is_empty() || key.is_empty() {
        tracing::warn!("Supabase not configured, skipping storage cleanup");
        return;
    }

    let mut paths = vec![];

    if let Some(meta) = metadata.and_then(|v| v.as_object()) {
        if let Some(urls) = meta.get("image_urls").and_then(|v| v.as_array()) {
            let bucket_prefix = format!("/{}/", MAGAZINE_BUCKET);
            for url_val in urls {
                if let Some(s) = url_val.as_str() {
                    if let Some(idx) = s.find(&bucket_prefix) {
                        let path = s[idx + bucket_prefix.len()..]
                            .split('?')
                            .next()
                            .unwrap_or("");
                        if !path.is_empty() {
                            paths.push(path.to_string());
                        }
                    }
                }
            }
        }
    }

    let folder = format!("sessions/{}", session_id);
    if paths.is_empty() {
        paths.push(folder);
    }

    let client = reqwest::Client::new();
    for path in paths {
        let delete_url = format!("{}/storage/v1/object/{}/{}", url, MAGAZINE_BUCKET, path);
        let res = client
            .delete(&delete_url)
            .header("Authorization", format!("Bearer {}", key))
            .header("apikey", key)
            .send()
            .await;
        if let Ok(r) = res {
            if r.status().is_success() {
                tracing::debug!("Deleted storage object: {}", path);
            }
        }
    }
}

#[derive(serde::Serialize)]
pub struct SessionListResponse {
    pub sessions: Vec<SessionListItem>,
}

#[derive(serde::Serialize)]
pub struct SessionListItem {
    pub id: Uuid,
    pub thread_id: String,
    pub magazine_id: Option<Uuid>,
    pub topic: String,
    pub current_step: String,
    pub created_at: Option<sea_orm::prelude::DateTimeWithTimeZone>,
}

#[derive(serde::Serialize)]
pub struct SessionDetailResponse {
    pub id: Uuid,
    pub thread_id: String,
    pub magazine_id: Option<Uuid>,
    pub topic: String,
    pub image_count: usize,
    pub image_urls: Vec<String>,
    pub cropped_image_urls: Vec<String>,
    pub current_step: String,
    pub step_status: String,
    pub step_error: Option<String>,
    pub writer_headline: Option<String>,
    pub writer_subheadline: Option<String>,
    pub writer_standfirst: Option<String>,
    pub images_json: serde_json::Value,
    pub outline: serde_json::Value,
    pub outline_prev: Option<serde_json::Value>,
    pub sections: serde_json::Value,
    pub layout_spec: serde_json::Value,
    pub external_solutions: serde_json::Value,
    pub revision_history: serde_json::Value,
}

#[derive(serde::Serialize)]
pub struct CreateSessionResponse {
    pub session_id: Uuid,
    pub thread_id: String,
    pub image_count: usize,
}

#[derive(serde::Serialize)]
pub struct DeleteSessionResponse {
    pub deleted: bool,
    pub session_id: Uuid,
}

pub fn router(state: AppState, app_config: AppConfig) -> Router<AppState> {
    Router::new()
        .route("/", get(list_sessions).post(create_session))
        .route("/{id}", get(get_session).delete(delete_session))
        .layer(axum::middleware::from_fn_with_state(
            state,
            crate::middleware::admin_db_middleware,
        ))
        .layer(axum::middleware::from_fn_with_state(
            app_config,
            crate::middleware::auth_middleware,
        ))
}
