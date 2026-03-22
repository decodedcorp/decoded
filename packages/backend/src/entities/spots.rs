use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// Spots entity
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "spots")]
pub struct Model {
    #[sea_orm(primary_key, column_type = "Uuid")]
    pub id: Uuid,

    pub post_id: Uuid,

    pub user_id: Uuid,

    pub position_left: String,

    pub position_top: String,

    #[sea_orm(nullable)]
    pub subcategory_id: Option<Uuid>,

    pub status: String,

    pub created_at: DateTimeWithTimeZone,

    pub updated_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::posts::Entity",
        from = "Column::PostId",
        to = "super::posts::Column::Id"
    )]
    Post,

    #[sea_orm(
        belongs_to = "super::users::Entity",
        from = "Column::UserId",
        to = "super::users::Column::Id"
    )]
    User,

    #[sea_orm(
        belongs_to = "super::subcategories::Entity",
        from = "Column::SubcategoryId",
        to = "super::subcategories::Column::Id"
    )]
    Subcategory,
}

impl Related<super::posts::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Post.def()
    }
}

impl Related<super::users::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::User.def()
    }
}

impl Related<super::subcategories::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Subcategory.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
