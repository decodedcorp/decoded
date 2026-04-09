use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "try_spot_tags")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub try_post_id: Uuid,
    pub spot_id: Uuid,
    pub created_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::posts::Entity",
        from = "Column::TryPostId",
        to = "super::posts::Column::Id",
        on_update = "NoAction",
        on_delete = "Cascade"
    )]
    Posts,
    #[sea_orm(
        belongs_to = "super::spots::Entity",
        from = "Column::SpotId",
        to = "super::spots::Column::Id",
        on_update = "NoAction",
        on_delete = "Cascade"
    )]
    Spots,
}

impl Related<super::posts::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Posts.def()
    }
}

impl Related<super::spots::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Spots.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
