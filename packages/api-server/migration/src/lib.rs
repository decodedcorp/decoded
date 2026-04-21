//! SeaORM 마이그레이션 — **supabase-dev 기준**으로 새로 쌓는 트랙.
//! 이전 전체 이력은 [`../legacy/`](../legacy/)를 참고한다.
//!
//! Baseline 절차·파일 목록: 저장소 루트 [`../../../../plan.md`](../../../../plan.md).
pub use sea_orm_migration::prelude::*;

mod m20260421_000001_enable_extensions;
mod m20260421_000002_warehouse_types;
mod m20260421_000003_public_tables;
mod m20260421_000004_warehouse_tables;
mod m20260421_000005_views;
mod m20260421_000006_indexes_and_constraints;
mod m20260421_000007_triggers_ddl;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20260421_000001_enable_extensions::Migration),
            Box::new(m20260421_000002_warehouse_types::Migration),
            Box::new(m20260421_000003_public_tables::Migration),
            Box::new(m20260421_000004_warehouse_tables::Migration),
            Box::new(m20260421_000005_views::Migration),
            Box::new(m20260421_000006_indexes_and_constraints::Migration),
            Box::new(m20260421_000007_triggers_ddl::Migration),
        ]
    }
}
