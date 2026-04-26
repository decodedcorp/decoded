use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// public.admin_audit_log entity — admin action audit trail (#333 moved from warehouse schema)
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "admin_audit_log")]
pub struct Model {
    #[sea_orm(primary_key, column_type = "Uuid")]
    pub id: Uuid,

    pub admin_user_id: Uuid,

    pub action: String,

    pub target_table: String,

    #[sea_orm(nullable)]
    pub target_id: Option<Uuid>,

    #[sea_orm(nullable, column_type = "JsonBinary")]
    pub before_state: Option<Json>,

    #[sea_orm(nullable, column_type = "JsonBinary")]
    pub after_state: Option<Json>,

    #[sea_orm(nullable, column_type = "JsonBinary")]
    pub metadata: Option<Json>,

    pub created_at: DateTimeWithTimeZone,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
