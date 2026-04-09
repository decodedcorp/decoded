use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// PostMagazineNewsReferences entity
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "post_magazine_news_references")]
pub struct Model {
    #[sea_orm(primary_key, column_type = "Uuid")]
    pub id: Uuid,

    pub post_magazine_id: Uuid,

    pub title: String,

    pub url: String,

    pub source: String,

    #[sea_orm(nullable)]
    pub summary: Option<String>,

    #[sea_orm(nullable)]
    pub og_title: Option<String>,

    #[sea_orm(nullable)]
    pub og_description: Option<String>,

    #[sea_orm(nullable)]
    pub og_image: Option<String>,

    #[sea_orm(nullable)]
    pub og_site_name: Option<String>,

    pub relevance_score: f64,

    pub credibility_score: f64,

    #[sea_orm(nullable)]
    pub matched_item: Option<String>,

    pub created_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::post_magazines::Entity",
        from = "Column::PostMagazineId",
        to = "super::post_magazines::Column::Id"
    )]
    PostMagazine,
}

impl Related<super::post_magazines::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::PostMagazine.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
