use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// UserBadges entity (many-to-many relationship)
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "user_badges")]
pub struct Model {
    #[sea_orm(primary_key, column_name = "user_id")]
    pub user_id: Uuid,

    #[sea_orm(primary_key, column_name = "badge_id")]
    pub badge_id: Uuid,

    #[sea_orm(column_name = "earned_at")]
    pub earned_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::users::Entity",
        from = "Column::UserId",
        to = "super::users::Column::Id",
        on_update = "NoAction",
        on_delete = "Cascade"
    )]
    Users,
    #[sea_orm(
        belongs_to = "super::badges::Entity",
        from = "Column::BadgeId",
        to = "super::badges::Column::Id",
        on_update = "NoAction",
        on_delete = "Cascade"
    )]
    Badges,
}

impl Related<super::users::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Users.def()
    }
}

impl Related<super::badges::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Badges.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
