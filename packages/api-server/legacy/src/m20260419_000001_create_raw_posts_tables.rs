use sea_orm_migration::prelude::*;

/// #258 — create warehouse.raw_post_sources + warehouse.raw_posts.
///
/// This migration mirrors `supabase/legacy/20260419120000_create_raw_posts_tables.sql`
/// so local dev environments using the SeaORM runner stay in sync with
/// Supabase-managed ones.
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();

        // raw_post_sources
        db.execute_unprepared(
            r#"
            CREATE TABLE IF NOT EXISTS "warehouse"."raw_post_sources" (
                "id" uuid DEFAULT gen_random_uuid() NOT NULL,
                "platform" text NOT NULL,
                "source_type" text NOT NULL,
                "source_identifier" text NOT NULL,
                "label" text,
                "is_active" boolean DEFAULT true NOT NULL,
                "fetch_interval_seconds" integer DEFAULT 3600 NOT NULL,
                "last_enqueued_at" timestamp with time zone,
                "last_scraped_at" timestamp with time zone,
                "metadata" jsonb,
                "created_at" timestamp with time zone DEFAULT now() NOT NULL,
                "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
                CONSTRAINT "raw_post_sources_pkey" PRIMARY KEY ("id"),
                CONSTRAINT "raw_post_sources_unique_target"
                    UNIQUE ("platform", "source_type", "source_identifier")
            );
            "#,
        )
        .await?;

        db.execute_unprepared(
            r#"CREATE INDEX IF NOT EXISTS "raw_post_sources_active_platform_idx"
                 ON "warehouse"."raw_post_sources" USING btree ("is_active", "platform");"#,
        )
        .await?;

        db.execute_unprepared(
            r#"CREATE INDEX IF NOT EXISTS "raw_post_sources_due_idx"
                 ON "warehouse"."raw_post_sources" USING btree ("last_enqueued_at")
                 WHERE "is_active" = true;"#,
        )
        .await?;

        // raw_posts
        db.execute_unprepared(
            r#"
            CREATE TABLE IF NOT EXISTS "warehouse"."raw_posts" (
                "id" uuid DEFAULT gen_random_uuid() NOT NULL,
                "source_id" uuid NOT NULL,
                "platform" text NOT NULL,
                "external_id" text NOT NULL,
                "external_url" text NOT NULL,
                "image_url" text NOT NULL,
                "r2_key" text,
                "r2_url" text,
                "image_hash" text,
                "caption" text,
                "author_name" text,
                "parse_status" text DEFAULT 'pending' NOT NULL,
                "parse_result" jsonb,
                "parse_error" text,
                "parse_attempts" integer DEFAULT 0 NOT NULL,
                "seed_post_id" uuid,
                "platform_metadata" jsonb,
                "dispatch_id" text,
                "created_at" timestamp with time zone DEFAULT now() NOT NULL,
                "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
                CONSTRAINT "raw_posts_pkey" PRIMARY KEY ("id"),
                CONSTRAINT "raw_posts_unique_external" UNIQUE ("platform", "external_id"),
                CONSTRAINT "raw_posts_parse_status_check"
                    CHECK ("parse_status" IN ('pending','parsing','parsed','failed','skipped')),
                CONSTRAINT "raw_posts_source_id_fkey"
                    FOREIGN KEY ("source_id")
                    REFERENCES "warehouse"."raw_post_sources"("id") ON DELETE CASCADE,
                CONSTRAINT "raw_posts_seed_post_id_fkey"
                    FOREIGN KEY ("seed_post_id")
                    REFERENCES "warehouse"."seed_posts"("id") ON DELETE SET NULL
            );
            "#,
        )
        .await?;

        db.execute_unprepared(
            r#"CREATE INDEX IF NOT EXISTS "raw_posts_source_idx"
                 ON "warehouse"."raw_posts" USING btree ("source_id");"#,
        )
        .await?;

        db.execute_unprepared(
            r#"CREATE INDEX IF NOT EXISTS "raw_posts_parse_status_idx"
                 ON "warehouse"."raw_posts" USING btree ("parse_status", "created_at");"#,
        )
        .await?;

        db.execute_unprepared(
            r#"CREATE INDEX IF NOT EXISTS "raw_posts_platform_idx"
                 ON "warehouse"."raw_posts" USING btree ("platform");"#,
        )
        .await?;

        // Shared updated_at trigger
        db.execute_unprepared(
            r#"
            CREATE OR REPLACE FUNCTION "warehouse"."set_updated_at"()
            RETURNS trigger
            LANGUAGE plpgsql
            AS $fn$
            BEGIN
              NEW.updated_at = now();
              RETURN NEW;
            END;
            $fn$;
            "#,
        )
        .await?;

        db.execute_unprepared(
            r#"DROP TRIGGER IF EXISTS "raw_post_sources_set_updated_at" ON "warehouse"."raw_post_sources";
               CREATE TRIGGER "raw_post_sources_set_updated_at"
                 BEFORE UPDATE ON "warehouse"."raw_post_sources"
                 FOR EACH ROW EXECUTE FUNCTION "warehouse"."set_updated_at"();"#,
        )
        .await?;

        db.execute_unprepared(
            r#"DROP TRIGGER IF EXISTS "raw_posts_set_updated_at" ON "warehouse"."raw_posts";
               CREATE TRIGGER "raw_posts_set_updated_at"
                 BEFORE UPDATE ON "warehouse"."raw_posts"
                 FOR EACH ROW EXECUTE FUNCTION "warehouse"."set_updated_at"();"#,
        )
        .await?;

        db.execute_unprepared(
            r#"ALTER TABLE "warehouse"."raw_post_sources" ENABLE ROW LEVEL SECURITY;
               ALTER TABLE "warehouse"."raw_posts" ENABLE ROW LEVEL SECURITY;"#,
        )
        .await?;

        db.execute_unprepared(
            r#"DROP POLICY IF EXISTS "raw_post_sources_select_public" ON "warehouse"."raw_post_sources";
               CREATE POLICY "raw_post_sources_select_public"
                 ON "warehouse"."raw_post_sources" FOR SELECT USING (true);
               DROP POLICY IF EXISTS "raw_posts_select_public" ON "warehouse"."raw_posts";
               CREATE POLICY "raw_posts_select_public"
                 ON "warehouse"."raw_posts" FOR SELECT USING (true);"#,
        )
        .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_connection();
        db.execute_unprepared(r#"DROP TABLE IF EXISTS "warehouse"."raw_posts";"#)
            .await?;
        db.execute_unprepared(r#"DROP TABLE IF EXISTS "warehouse"."raw_post_sources";"#)
            .await?;
        Ok(())
    }
}
