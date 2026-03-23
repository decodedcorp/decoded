//! Agent sessions entity (Magazine Editor Pipeline)
//!
//! Table: agent_sessions - stores magazine session state with metadata

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

/// AgentSessions entity - magazine editor pipeline sessions
#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "agent_sessions")]
pub struct Model {
    #[sea_orm(primary_key, column_type = "Uuid")]
    pub id: Uuid,

    pub thread_id: String,

    pub magazine_id: Option<Uuid>,

    #[sea_orm(column_type = "Uuid")]
    pub user_id: Uuid,

    pub status: String,

    pub keywords: Option<Json>,

    pub metadata: Option<Json>,

    pub created_at: Option<DateTimeWithTimeZone>,

    pub updated_at: Option<DateTimeWithTimeZone>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
