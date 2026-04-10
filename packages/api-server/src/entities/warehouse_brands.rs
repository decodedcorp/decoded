use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// warehouse.brands entity — fashion brand profiles
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(schema_name = "warehouse", table_name = "brands")]
pub struct Model {
    #[sea_orm(primary_key, column_type = "Uuid")]
    pub id: Uuid,

    #[sea_orm(nullable)]
    pub name_ko: Option<String>,

    #[sea_orm(nullable)]
    pub name_en: Option<String>,

    #[sea_orm(nullable)]
    pub logo_image_url: Option<String>,

    #[sea_orm(nullable)]
    pub primary_instagram_account_id: Option<Uuid>,

    #[sea_orm(nullable, column_type = "JsonBinary")]
    pub metadata: Option<Json>,

    pub created_at: DateTimeWithTimeZone,

    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
