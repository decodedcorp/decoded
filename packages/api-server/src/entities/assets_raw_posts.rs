use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

/// assets.public.raw_posts entity (#333).
///
/// 신규 assets Supabase 프로젝트의 공개(public) 스키마에 위치한다. schema_name 을
/// 명시하지 않아 기본 search_path(public)를 따른다. 이 엔티티에 대한 쿼리는 반드시
/// `AppState.assets_db` 로 실행해야 한다 — prod pool 에는 이 테이블이 존재하지 않는다.
///
/// 파이프라인 상태머신:
///   `NOT_STARTED` → `IN_PROGRESS` → `COMPLETED` → (admin verify) → `VERIFIED`
///                                                               ↘ `ERROR`
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "raw_posts")]
pub struct Model {
    #[sea_orm(primary_key, column_type = "Uuid")]
    pub id: Uuid,

    pub source_id: Uuid,
    pub platform: String,
    pub external_id: String,

    #[sea_orm(nullable)]
    pub external_url: Option<String>,

    /// 이미지 위치 URL — ai-server R2 업로드 결과 또는 합성 결과의 R2 퍼블릭 URL.
    /// (#347: 기존 r2_url/r2_key 컬럼 드롭 후 단일화)
    #[sea_orm(nullable)]
    pub image_url: Option<String>,

    #[sea_orm(nullable)]
    pub image_hash: Option<String>,

    #[sea_orm(nullable)]
    pub caption: Option<String>,

    #[sea_orm(nullable)]
    pub author_name: Option<String>,

    /// 파이프라인 상태 (#333). verify 엔드포인트 가드에서 COMPLETED 만 허용한다.
    pub status: PipelineStatus,

    /// 파서 세부 상태 (하위 텔레메트리). `status` 와 분리되어 있으며 값 범위는
    /// {pending, parsing, parsed, failed, skipped}.
    pub parse_status: String,

    #[sea_orm(nullable, column_type = "JsonBinary")]
    pub parse_result: Option<Json>,

    #[sea_orm(nullable)]
    pub parse_error: Option<String>,

    pub parse_attempts: i32,

    /// admin 이 검증 완료한 시각. 미검증 시 NULL.
    #[sea_orm(nullable)]
    pub verified_at: Option<DateTimeWithTimeZone>,

    /// 검증한 admin user id. prod 프로젝트의 `public.users.id` 를 참조하지만 cross-project FK
    /// 가 불가능하므로 애플리케이션 레벨에서만 의미를 갖는다.
    #[sea_orm(nullable)]
    pub verified_by: Option<Uuid>,

    #[sea_orm(nullable, column_type = "JsonBinary")]
    pub platform_metadata: Option<Json>,

    #[sea_orm(nullable)]
    pub dispatch_id: Option<String>,

    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
}

/// assets.public.pipeline_status enum (#333).
///
/// PostgreSQL enum 과 1:1 매핑. serde 직렬화는 SCREAMING_SNAKE 를 그대로 쓰고,
/// DB 표현도 동일하다.
#[derive(
    Copy, Clone, Debug, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, Deserialize, ToSchema,
)]
#[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "pipeline_status")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum PipelineStatus {
    #[sea_orm(string_value = "NOT_STARTED")]
    NotStarted,
    #[sea_orm(string_value = "IN_PROGRESS")]
    InProgress,
    #[sea_orm(string_value = "COMPLETED")]
    Completed,
    #[sea_orm(string_value = "VERIFIED")]
    Verified,
    #[sea_orm(string_value = "ERROR")]
    Error,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::assets_raw_post_sources::Entity",
        from = "Column::SourceId",
        to = "super::assets_raw_post_sources::Column::Id",
        on_delete = "Cascade"
    )]
    Source,
}

impl Related<super::assets_raw_post_sources::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Source.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
