use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// ClickLogs entity
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "click_logs")]
pub struct Model {
    #[sea_orm(primary_key, column_type = "Uuid")]
    pub id: Uuid,

    pub user_id: Option<Uuid>,

    pub solution_id: Uuid,

    pub ip_address: String,

    pub user_agent: Option<String>,

    pub referrer: Option<String>,

    pub created_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::users::Entity",
        from = "Column::UserId",
        to = "super::users::Column::Id",
        on_delete = "SetNull",
        on_update = "Cascade"
    )]
    Users,

    #[sea_orm(
        belongs_to = "super::solutions::Entity",
        from = "Column::SolutionId",
        to = "super::solutions::Column::Id",
        on_delete = "Cascade",
        on_update = "Cascade"
    )]
    Solutions,
}

impl Related<super::users::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Users.def()
    }
}

impl Related<super::solutions::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Solutions.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
