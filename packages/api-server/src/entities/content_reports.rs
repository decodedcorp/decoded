use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// ContentReports entity
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "content_reports")]
pub struct Model {
    #[sea_orm(primary_key, column_type = "Uuid")]
    pub id: Uuid,

    pub target_type: String,

    pub target_id: Uuid,

    pub reporter_id: Uuid,

    pub reason: String,

    #[sea_orm(nullable)]
    pub details: Option<String>,

    pub status: String,

    #[sea_orm(nullable)]
    pub resolution: Option<String>,

    #[sea_orm(nullable)]
    pub reviewed_by: Option<Uuid>,

    pub created_at: DateTimeWithTimeZone,

    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
