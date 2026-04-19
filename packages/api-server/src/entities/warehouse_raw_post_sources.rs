use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// warehouse.raw_post_sources entity (#258)
///
/// Platform-independent registry of scrape targets. api-server's batch
/// scheduler reads this table to decide which sources are due for a fetch.
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(schema_name = "warehouse", table_name = "raw_post_sources")]
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

    #[sea_orm(nullable, column_type = "JsonBinary")]
    pub metadata: Option<Json>,

    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
