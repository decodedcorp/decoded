use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// Solutions entity
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "solutions")]
pub struct Model {
    #[sea_orm(primary_key, column_type = "Uuid")]
    pub id: Uuid,

    pub spot_id: Uuid,

    pub user_id: Uuid,

    #[sea_orm(nullable)]
    pub match_type: Option<String>,

    #[sea_orm(nullable)]
    pub link_type: Option<String>,

    pub title: String,

    #[sea_orm(nullable)]
    pub original_url: Option<String>,

    #[sea_orm(nullable)]
    pub affiliate_url: Option<String>,

    #[sea_orm(nullable)]
    pub thumbnail_url: Option<String>,

    #[sea_orm(nullable)]
    pub description: Option<String>,

    #[sea_orm(nullable)]
    pub comment: Option<String>,

    pub accurate_count: i32,

    pub different_count: i32,

    pub is_verified: bool,

    pub is_adopted: bool,

    #[sea_orm(nullable)]
    pub adopted_at: Option<DateTimeWithTimeZone>,

    pub click_count: i32,

    pub purchase_count: i32,

    pub status: String,

    #[sea_orm(nullable, column_type = "Json")]
    pub metadata: Option<Json>,

    #[sea_orm(nullable, column_type = "Json")]
    pub keywords: Option<Json>,

    #[sea_orm(nullable, column_type = "Json")]
    pub qna: Option<Json>,

    pub created_at: DateTimeWithTimeZone,

    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::spots::Entity",
        from = "Column::SpotId",
        to = "super::spots::Column::Id"
    )]
    Spot,

    #[sea_orm(
        belongs_to = "super::users::Entity",
        from = "Column::UserId",
        to = "super::users::Column::Id"
    )]
    User,
}

impl Related<super::spots::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Spot.def()
    }
}

impl Related<super::users::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::User.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
