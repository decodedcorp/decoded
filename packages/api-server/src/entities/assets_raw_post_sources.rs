use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// assets.public.raw_post_sources entity (#333).
///
/// 신규 assets Supabase 프로젝트의 공개(public) 스키마. 쿼리는 `AppState.assets_db`
/// 로만 실행한다.
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "raw_post_sources")]
pub struct Model {
    #[sea_orm(primary_key, column_type = "Uuid")]
    pub id: Uuid,

    pub platform: String,
    pub source_type: String,
    pub source_identifier: String,

    #[sea_orm(nullable)]
    pub label: Option<String>,

    pub is_active: bool,
    pub fetch_interval_seconds: i32,

    #[sea_orm(nullable)]
    pub last_enqueued_at: Option<DateTimeWithTimeZone>,

    #[sea_orm(nullable)]
    pub last_scraped_at: Option<DateTimeWithTimeZone>,

    /// 초기 백필(최초 1회) 스크랩 완료 시각. 이후부터는 incremental fetch 로 전환된다.
    #[sea_orm(nullable)]
    pub initial_scraped_at: Option<DateTimeWithTimeZone>,

    #[sea_orm(nullable, column_type = "JsonBinary")]
    pub metadata: Option<Json>,

    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
