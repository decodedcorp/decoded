use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// Categories entity
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "categories")]
pub struct Model {
    #[sea_orm(primary_key, column_type = "Uuid")]
    pub id: Uuid,

    pub code: String,

    pub name: Json,

    pub icon_url: Option<String>,

    pub color_hex: Option<String>,

    pub description: Option<Json>,

    pub display_order: i32,

    pub is_active: bool,

    pub created_at: DateTimeWithTimeZone,

    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
