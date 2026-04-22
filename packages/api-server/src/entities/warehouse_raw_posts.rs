use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// warehouse.raw_posts entity (#258)
///
/// A scraped post that has been archived to R2 and is awaiting parsing.
/// Populated by the gRPC callback from ai-server after a fetch job.
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(schema_name = "warehouse", table_name = "raw_posts")]
pub struct Model {
    #[sea_orm(primary_key, column_type = "Uuid")]
    pub id: Uuid,

    pub source_id: Uuid,
    pub platform: String,
    pub external_id: String,
    pub external_url: String,
    pub image_url: String,

    #[sea_orm(nullable)]
    pub r2_key: Option<String>,

    #[sea_orm(nullable)]
    pub r2_url: Option<String>,

    #[sea_orm(nullable)]
    pub image_hash: Option<String>,

    #[sea_orm(nullable)]
    pub caption: Option<String>,

    #[sea_orm(nullable)]
    pub author_name: Option<String>,

    pub parse_status: String,

    /// Original image reverse search lifecycle (#261):
    /// pending | searching | found | not_found | skipped
    pub original_status: String,

    #[sea_orm(nullable, column_type = "JsonBinary")]
    pub parse_result: Option<Json>,

    #[sea_orm(nullable)]
    pub parse_error: Option<String>,

    pub parse_attempts: i32,

    #[sea_orm(nullable)]
    pub seed_post_id: Option<Uuid>,

    #[sea_orm(nullable, column_type = "JsonBinary")]
    pub platform_metadata: Option<Json>,

    #[sea_orm(nullable)]
    pub dispatch_id: Option<String>,

    pub created_at: DateTimeWithTimeZone,
    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::warehouse_raw_post_sources::Entity",
        from = "Column::SourceId",
        to = "super::warehouse_raw_post_sources::Column::Id",
        on_delete = "Cascade"
    )]
    Source,
}

impl Related<super::warehouse_raw_post_sources::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Source.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
