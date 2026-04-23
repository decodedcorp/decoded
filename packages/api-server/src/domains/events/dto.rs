use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use utoipa::ToSchema;
use uuid::Uuid;
use validator::Validate;

/// Client 가 보내는 단일 이벤트.
/// `user_id` 는 서버가 JWT 에서 강제 주입하므로 client 가 지정할 수 없다.
#[derive(Debug, Clone, Deserialize, ToSchema, Validate)]
pub struct EventItem {
    #[validate(length(min = 1, max = 64))]
    pub event_type: String,

    pub entity_id: Option<Uuid>,

    #[validate(length(min = 1, max = 128))]
    pub session_id: String,

    #[validate(length(min = 1, max = 2048))]
    pub page_path: String,

    pub metadata: Option<JsonValue>,

    /// 클라이언트가 이벤트 발생 순간에 기록한 ISO timestamp.
    /// 서버에서 보정할 수 있으나 기본은 client 값 유지.
    pub timestamp: DateTime<Utc>,
}

/// Ingest 응답 — sendBeacon 은 응답 body 를 읽지 않으므로 최소 형태.
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct IngestEventsResponse {
    pub ok: bool,
    pub accepted: usize,
}
