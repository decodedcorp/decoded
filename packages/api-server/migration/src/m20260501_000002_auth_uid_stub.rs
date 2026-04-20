use sea_orm_migration::prelude::*;

/// Provide `auth.uid()` stub for plain Postgres (local dev).
///
/// Why: existing RLS policies on public tables reference `auth.uid()`, which is provided
/// by Supabase's GoTrue/PostgREST. Local plain Postgres doesn't have it, so RLS policy
/// creation fails. We create a stub returning NULL so policies compile and behave as if
/// no user were authenticated (api-server uses service_role, which bypasses RLS anyway).
///
/// On prod Supabase: `auth` schema already exists with the real `auth.uid()` function.
/// This migration SKIPS creation when the function already exists — the real one is
/// preserved, never overwritten.
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                DO $$
                BEGIN
                    -- Ensure auth schema exists (Supabase prod: already present; local: create).
                    CREATE SCHEMA IF NOT EXISTS auth;

                    -- Create stub only if auth.uid() doesn't already exist.
                    -- On prod Supabase, GoTrue creates the real function first, so this no-ops.
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_proc
                        WHERE proname = 'uid'
                          AND pronamespace = 'auth'::regnamespace
                    ) THEN
                        CREATE FUNCTION auth.uid() RETURNS uuid
                            LANGUAGE sql STABLE
                            AS $fn$ SELECT NULL::uuid $fn$;
                    END IF;

                    -- Same for auth.role() and auth.jwt() — referenced by some policies.
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_proc
                        WHERE proname = 'role'
                          AND pronamespace = 'auth'::regnamespace
                    ) THEN
                        CREATE FUNCTION auth.role() RETURNS text
                            LANGUAGE sql STABLE
                            AS $fn$ SELECT NULL::text $fn$;
                    END IF;

                    IF NOT EXISTS (
                        SELECT 1 FROM pg_proc
                        WHERE proname = 'jwt'
                          AND pronamespace = 'auth'::regnamespace
                    ) THEN
                        CREATE FUNCTION auth.jwt() RETURNS jsonb
                            LANGUAGE sql STABLE
                            AS $fn$ SELECT NULL::jsonb $fn$;
                    END IF;
                END $$;
                "#,
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Do NOT drop auth.uid()/role()/jwt() on prod — they are real Supabase functions.
        // Down is a no-op; if we dropped them we could break prod authentication.
        let _ = manager;
        Ok(())
    }
}
