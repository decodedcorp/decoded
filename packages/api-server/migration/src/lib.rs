//! SeaORM 마이그레이션 — **supabase-dev 기준**으로 새로 쌓는 트랙.
//! 이전 전체 이력은 [`../legacy/`](../legacy/)를 참고한다.
pub use sea_orm_migration::prelude::*;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![]
    }
}
