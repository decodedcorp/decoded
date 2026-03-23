use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// Settlements entity
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "settlements")]
pub struct Model {
    #[sea_orm(primary_key, column_type = "Uuid")]
    pub id: Uuid,

    pub user_id: Uuid,

    #[sea_orm(column_type = "Decimal(Some((12, 2)))")]
    pub amount: Decimal,

    pub currency: String,

    pub status: String, // "pending" | "processing" | "completed" | "failed"

    pub bank_info: Option<Json>,

    pub processed_at: Option<DateTimeWithTimeZone>,

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
}

impl Related<super::users::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Users.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
