use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// Earnings entity
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "earnings")]
pub struct Model {
    #[sea_orm(primary_key, column_type = "Uuid")]
    pub id: Uuid,

    pub user_id: Uuid,

    pub solution_id: Uuid,

    #[sea_orm(column_type = "Decimal(Some((12, 2)))")]
    pub amount: Decimal,

    pub currency: String,

    pub status: String, // "pending" | "confirmed" | "settled"

    pub affiliate_platform: Option<String>,

    pub created_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::users::Entity",
        from = "Column::UserId",
        to = "super::users::Column::Id",
        on_delete = "Cascade",
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
