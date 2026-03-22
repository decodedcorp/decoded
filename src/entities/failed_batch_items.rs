use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// Failed batch items entity for retry queue
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "failed_batch_items")]
pub struct Model {
    #[sea_orm(primary_key, column_type = "Uuid")]
    pub id: Uuid,

    pub item_id: String,

    pub batch_id: String,

    pub url: String,

    pub status: String,

    pub error_message: Option<String>,

    pub retry_count: i32,

    pub next_retry_at: DateTimeWithTimeZone,

    pub created_at: DateTimeWithTimeZone,

    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
