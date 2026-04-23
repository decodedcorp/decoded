use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// warehouse.source_media_originals entity (#261)
///
/// Original high-quality images surfaced by reverse-image search and
/// archived to R2. Multiple candidates may exist per raw_post; the
/// current active one is flagged `is_primary = true` (at most one).
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(schema_name = "warehouse", table_name = "source_media_originals")]
pub struct Model {
    #[sea_orm(primary_key, column_type = "Uuid")]
    pub id: Uuid,

    pub raw_post_id: Uuid,

    pub origin_url: String,
    pub origin_domain: String,

    pub r2_key: String,
    pub r2_url: String,

    #[sea_orm(nullable)]
    pub width: Option<i32>,

    #[sea_orm(nullable)]
    pub height: Option<i32>,

    #[sea_orm(nullable)]
    pub byte_size: Option<i32>,

    #[sea_orm(nullable)]
    pub image_hash: Option<String>,

    pub search_provider: String,

    pub is_primary: bool,

    #[sea_orm(nullable, column_type = "JsonBinary")]
    pub metadata: Option<Json>,

    pub created_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::warehouse_raw_posts::Entity",
        from = "Column::RawPostId",
        to = "super::warehouse_raw_posts::Column::Id",
        on_delete = "Cascade"
    )]
    RawPost,
}

impl Related<super::warehouse_raw_posts::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::RawPost.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
