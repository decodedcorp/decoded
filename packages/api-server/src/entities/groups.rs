use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// public.groups entity — K-pop group profiles (#333 moved from warehouse schema)
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "groups")]
pub struct Model {
    #[sea_orm(primary_key, column_type = "Uuid")]
    pub id: Uuid,

    #[sea_orm(nullable)]
    pub name_ko: Option<String>,

    #[sea_orm(nullable)]
    pub name_en: Option<String>,

    #[sea_orm(nullable)]
    pub profile_image_url: Option<String>,

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
