use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// PostMagazines entity
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "post_magazines")]
pub struct Model {
    #[sea_orm(primary_key, column_type = "Uuid")]
    pub id: Uuid,

    pub title: String,

    #[sea_orm(nullable)]
    pub subtitle: Option<String>,

    #[sea_orm(nullable)]
    pub keyword: Option<String>,

    #[sea_orm(nullable, column_type = "JsonBinary")]
    pub layout_json: Option<Json>,

    pub status: String,

    #[sea_orm(nullable)]
    pub review_summary: Option<String>,

    #[sea_orm(nullable, column_type = "JsonBinary")]
    pub error_log: Option<Json>,

    pub created_at: DateTimeWithTimeZone,

    pub updated_at: DateTimeWithTimeZone,

    #[sea_orm(nullable)]
    pub published_at: Option<DateTimeWithTimeZone>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
