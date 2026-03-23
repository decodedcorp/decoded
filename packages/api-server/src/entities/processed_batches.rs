use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// Processed batches entity for idempotency
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "processed_batches")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub batch_id: String,

    pub processing_timestamp: DateTimeWithTimeZone,

    pub total_count: i32,

    pub success_count: i32,

    pub partial_count: i32,

    pub failed_count: i32,

    pub processing_time_ms: i32,

    pub created_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
