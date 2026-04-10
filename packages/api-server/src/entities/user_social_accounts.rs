use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// User social accounts entity
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "user_social_accounts")]
pub struct Model {
    #[sea_orm(primary_key, column_type = "Uuid")]
    pub id: Uuid,

    pub user_id: Uuid,

    pub provider: String,

    pub provider_user_id: String,

    pub last_synced_at: Option<DateTimeWithTimeZone>,

    pub created_at: DateTimeWithTimeZone,

    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
