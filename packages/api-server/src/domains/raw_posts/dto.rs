//! Raw Posts DTOs (#258)
//!
//! Lightweight read/write shapes for admin-facing endpoints and
//! the callback service. Keeps entity/JSON boundaries explicit.

use chrono::{DateTime, FixedOffset};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use utoipa::ToSchema;
use uuid::Uuid;
use validator::Validate;

// -----------------------
// raw_post_sources
// -----------------------

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct RawPostSource {
    pub id: Uuid,
    pub platform: String,
    pub source_type: String,
    pub source_identifier: String,
    pub label: Option<String>,
    pub is_active: bool,
    pub fetch_interval_seconds: i32,
    pub last_enqueued_at: Option<DateTime<FixedOffset>>,
    pub last_scraped_at: Option<DateTime<FixedOffset>>,
    pub metadata: Option<JsonValue>,
    pub created_at: DateTime<FixedOffset>,
    pub updated_at: DateTime<FixedOffset>,
}

#[derive(Debug, Clone, Deserialize, ToSchema, Validate)]
pub struct CreateRawPostSourceDto {
    #[validate(length(min = 1, max = 64))]
    pub platform: String,
    #[validate(length(min = 1, max = 64))]
    pub source_type: String,
    #[validate(length(min = 1, max = 512))]
    pub source_identifier: String,
    #[validate(length(max = 256))]
    pub label: Option<String>,
    #[serde(default = "default_interval")]
    #[validate(range(min = 60, max = 86_400))]
    pub fetch_interval_seconds: i32,
    pub metadata: Option<JsonValue>,
    #[serde(default = "default_true")]
    pub is_active: bool,
}

fn default_interval() -> i32 {
    3600
}
fn default_true() -> bool {
    true
}

#[derive(Debug, Clone, Deserialize, ToSchema, Validate)]
pub struct UpdateRawPostSourceDto {
    #[validate(length(max = 256))]
    pub label: Option<String>,
    pub is_active: Option<bool>,
    #[validate(range(min = 60, max = 86_400))]
    pub fetch_interval_seconds: Option<i32>,
    pub metadata: Option<JsonValue>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ListSourcesQuery {
    pub platform: Option<String>,
    pub is_active: Option<bool>,
    pub limit: Option<u64>,
    pub offset: Option<u64>,
}

// -----------------------
// raw_posts
// -----------------------

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct RawPost {
    pub id: Uuid,
    pub source_id: Uuid,
    pub platform: String,
    pub external_id: String,
    pub external_url: String,
    pub image_url: String,
    pub r2_key: Option<String>,
    pub r2_url: Option<String>,
    pub image_hash: Option<String>,
    pub caption: Option<String>,
    pub author_name: Option<String>,
    /// 파이프라인 상태머신 (#333). admin UI 에서 COMPLETED 만 검증 가능.
    pub status: crate::entities::PipelineStatus,
    pub parse_status: String,
    pub parse_attempts: i32,
    pub verified_at: Option<DateTime<FixedOffset>>,
    pub verified_by: Option<Uuid>,
    pub platform_metadata: Option<JsonValue>,
    pub dispatch_id: Option<String>,
    pub created_at: DateTime<FixedOffset>,
    pub updated_at: DateTime<FixedOffset>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ListItemsQuery {
    pub platform: Option<String>,
    pub parse_status: Option<String>,
    pub source_id: Option<Uuid>,
    pub limit: Option<u64>,
    pub offset: Option<u64>,
}

// -----------------------
// callback (gRPC) input shape
// -----------------------

#[derive(Debug, Clone)]
pub struct RawPostUpsertInput {
    pub platform: String,
    pub external_id: String,
    pub external_url: String,
    pub image_url: String,
    pub r2_key: Option<String>,
    pub r2_url: Option<String>,
    pub caption: Option<String>,
    pub author_name: Option<String>,
    pub platform_metadata: Option<JsonValue>,
}

// -----------------------
// verify (#333)
// -----------------------

/// 검증(verify) 시 admin 이 재정의하는 필드 (#333).
///
/// 모두 optional — 비우면 raw_post 의 원본 값(caption → title, author_name → artist_name)을
/// 그대로 사용한다. verify 는 COMPLETED 상태의 raw_post 에만 가능하며, 성공 시
/// `prod.public.posts` 에 새 로우가 INSERT 되고 assets 쪽은 status=VERIFIED 로 전이된다
/// (단, APP_ENV=Local 이면 assets write 생략).
#[derive(Debug, Clone, Default, Deserialize, Serialize, ToSchema)]
pub struct VerifyRawPostDto {
    /// post.title override (기본: raw_post.caption)
    pub title: Option<String>,
    /// 아티스트 이름 (warehouse FK auto-resolve 에 사용)
    pub artist_name: Option<String>,
    /// 그룹명 (warehouse FK auto-resolve 에 사용)
    pub group_name: Option<String>,
    /// 상황/컨텍스트
    pub context: Option<String>,
}

// -----------------------
// stats
// -----------------------

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct RawPostsStatsEntry {
    pub platform: String,
    pub parse_status: String,
    pub count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct RawPostsStatsResponse {
    pub entries: Vec<RawPostsStatsEntry>,
}

// -----------------------
// pagination
// -----------------------

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct RawPostSourcesPage {
    pub items: Vec<RawPostSource>,
    pub total: u64,
    pub limit: u64,
    pub offset: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct RawPostsItemsPage {
    pub items: Vec<RawPost>,
    pub total: u64,
    pub limit: u64,
    pub offset: u64,
}
