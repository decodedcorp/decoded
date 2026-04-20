use sea_orm_migration::prelude::*;

/// Enable Postgres extensions required by the schema.
///
/// Why: prod Supabase already has these installed (into the `extensions` schema).
/// Local plain Postgres doesn't, and without them later migrations fail (`vector`
/// type, `gen_random_uuid()`, `unaccent()`, trigram indexes).
///
/// Strategy: `CREATE EXTENSION IF NOT EXISTS` without a schema qualifier — installs
/// into the default schema on local (usually `public`), no-ops on prod where the
/// extension already exists. The `extensions` schema location on prod is preserved
/// because we never drop the existing extension.
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE EXTENSION IF NOT EXISTS pgcrypto;
                CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
                CREATE EXTENSION IF NOT EXISTS pg_trgm;
                CREATE EXTENSION IF NOT EXISTS unaccent;
                CREATE EXTENSION IF NOT EXISTS vector;
                "#,
            )
            .await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Do NOT drop extensions — other migrations and prod schema depend on them.
        let _ = manager;
        Ok(())
    }
}
