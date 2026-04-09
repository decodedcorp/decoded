use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// Posts entity
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "posts")]
pub struct Model {
    #[sea_orm(primary_key, column_type = "Uuid")]
    pub id: Uuid,

    pub user_id: Uuid,

    pub image_url: String,

    pub media_type: String,

    #[sea_orm(nullable)]
    pub title: Option<String>,

    pub media_metadata: Option<Json>,

    pub group_name: Option<String>,

    pub artist_name: Option<String>,

    #[sea_orm(nullable)]
    pub artist_id: Option<Uuid>,

    #[sea_orm(nullable)]
    pub group_id: Option<Uuid>,

    pub context: Option<String>,

    pub view_count: i32,

    pub status: String,

    #[sea_orm(column_type = "Double", nullable)]
    pub trending_score: Option<f64>,

    /// 포스트 생성 시 솔루션을 알고 등록했는지 (true=with-solutions, false=without, null=기존 데이터)
    #[sea_orm(nullable)]
    pub created_with_solutions: Option<bool>,

    #[sea_orm(nullable)]
    pub post_magazine_id: Option<Uuid>,

    #[sea_orm(column_type = "Text", nullable)]
    pub ai_summary: Option<String>,

    #[sea_orm(nullable, column_type = "JsonBinary")]
    pub style_tags: Option<Json>,

    pub created_at: DateTimeWithTimeZone,

    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::users::Entity",
        from = "Column::UserId",
        to = "super::users::Column::Id"
    )]
    User,

    #[sea_orm(
        belongs_to = "super::post_magazines::Entity",
        from = "Column::PostMagazineId",
        to = "super::post_magazines::Column::Id"
    )]
    PostMagazine,
}

impl Related<super::users::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::User.def()
    }
}

impl Related<super::post_magazines::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::PostMagazine.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
