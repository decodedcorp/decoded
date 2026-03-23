use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value;

/// Badges entity
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "badges")]
pub struct Model {
    #[sea_orm(primary_key, column_type = "Uuid")]
    pub id: Uuid,

    #[sea_orm(column_name = "type")]
    pub r#type: String, // "specialist" | "category" | "achievement" | "milestone"

    pub name: String,

    pub description: Option<String>,

    #[sea_orm(column_name = "icon_url")]
    pub icon_url: Option<String>,

    #[sea_orm(column_type = "JsonBinary")]
    pub criteria: Value,

    pub rarity: String, // "common" | "rare" | "epic" | "legendary"

    #[sea_orm(column_name = "created_at")]
    pub created_at: DateTimeWithTimeZone,

    #[sea_orm(column_name = "updated_at")]
    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
