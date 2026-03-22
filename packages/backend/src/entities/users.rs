use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// Users entity
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "users")]
pub struct Model {
    #[sea_orm(primary_key, column_type = "Uuid")]
    pub id: Uuid,

    pub email: String,

    pub username: String,

    pub display_name: Option<String>,

    pub avatar_url: Option<String>,

    pub bio: Option<String>,

    pub rank: String,

    pub total_points: i32,

    pub is_admin: bool,

    pub created_at: DateTimeWithTimeZone,

    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
