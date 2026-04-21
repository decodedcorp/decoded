use sea_orm_migration::prelude::*;

/// Bootstrap the entire `warehouse` schema: 12 tables + ENUMs + indexes + RLS + trigger.
///
/// Why: `warehouse.*` was previously created only by
/// `supabase/legacy/20260409075040_remote_schema.sql` (Supabase CLI). After #202 the
/// SeaORM migrator is the single source of truth, so local plain Postgres needs to build
/// the whole schema too. Prod already has everything — all statements are idempotent, so
/// re-running against prod is a no-op.
///
/// Scope (matches prod):
/// - Schema `warehouse` + ENUM types `account_type`, `entity_ig_role`
/// - 12 tables: instagram_accounts, artists, groups, brands, group_members, posts, images,
///   seed_posts, seed_spots, seed_solutions, seed_asset, admin_audit_log
/// - All PKs, unique constraints, FKs, indexes from the original dump
/// - `warehouse.touch_updated_at()` function + BEFORE UPDATE triggers on 10 tables
/// - Row-level security enabled on all tables + public-read SELECT policies
/// - Grants for anon / authenticated (read-only) / service_role (full)
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let conn = manager.get_connection();

        // 1) Schema + ENUMs
        conn.execute_unprepared(
            r#"
            CREATE SCHEMA IF NOT EXISTS warehouse;

            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
                               WHERE t.typname = 'account_type' AND n.nspname = 'warehouse') THEN
                    CREATE TYPE warehouse.account_type AS ENUM
                        ('artist', 'group', 'brand', 'source', 'influencer', 'place', 'other');
                END IF;

                IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
                               WHERE t.typname = 'entity_ig_role' AND n.nspname = 'warehouse') THEN
                    CREATE TYPE warehouse.entity_ig_role AS ENUM
                        ('primary', 'regional', 'secondary');
                END IF;
            END $$;
            "#,
        )
        .await?;

        // 2) touch_updated_at function
        conn.execute_unprepared(
            r#"
            CREATE OR REPLACE FUNCTION warehouse.touch_updated_at() RETURNS trigger
                LANGUAGE plpgsql
                SET search_path TO ''
                AS $fn$
            begin
              new.updated_at = now();
              return new;
            end;
            $fn$;
            "#,
        )
        .await?;

        // 3) Tables — created in FK dependency order
        conn.execute_unprepared(
            r#"
            CREATE TABLE IF NOT EXISTS warehouse.instagram_accounts (
                id uuid DEFAULT gen_random_uuid() NOT NULL,
                username text NOT NULL,
                account_type warehouse.account_type NOT NULL,
                name_ko text,
                name_en text,
                display_name text,
                bio text,
                profile_image_url text,
                is_active boolean DEFAULT true NOT NULL,
                metadata jsonb,
                wikidata_status text,
                wikidata_id text,
                needs_review boolean,
                created_at timestamp with time zone DEFAULT now() NOT NULL,
                updated_at timestamp with time zone DEFAULT now() NOT NULL,
                brand_id uuid,
                artist_id uuid,
                entity_ig_role warehouse.entity_ig_role,
                entity_region_code text
            );

            CREATE TABLE IF NOT EXISTS warehouse.artists (
                id uuid DEFAULT gen_random_uuid() NOT NULL,
                name_ko text,
                name_en text,
                profile_image_url text,
                primary_instagram_account_id uuid,
                metadata jsonb,
                created_at timestamp with time zone DEFAULT now() NOT NULL,
                updated_at timestamp with time zone DEFAULT now() NOT NULL
            );

            CREATE TABLE IF NOT EXISTS warehouse.groups (
                id uuid DEFAULT gen_random_uuid() NOT NULL,
                name_ko text,
                name_en text,
                profile_image_url text,
                primary_instagram_account_id uuid,
                metadata jsonb,
                created_at timestamp with time zone DEFAULT now() NOT NULL,
                updated_at timestamp with time zone DEFAULT now() NOT NULL
            );

            CREATE TABLE IF NOT EXISTS warehouse.brands (
                id uuid DEFAULT gen_random_uuid() NOT NULL,
                name_ko text,
                name_en text,
                logo_image_url text,
                primary_instagram_account_id uuid,
                metadata jsonb,
                created_at timestamp with time zone DEFAULT now() NOT NULL,
                updated_at timestamp with time zone DEFAULT now() NOT NULL
            );

            CREATE TABLE IF NOT EXISTS warehouse.group_members (
                group_id uuid NOT NULL,
                artist_id uuid NOT NULL,
                is_active boolean DEFAULT true NOT NULL,
                metadata jsonb,
                created_at timestamp with time zone DEFAULT now() NOT NULL,
                updated_at timestamp with time zone DEFAULT now() NOT NULL
            );

            CREATE TABLE IF NOT EXISTS warehouse.posts (
                id uuid DEFAULT gen_random_uuid() NOT NULL,
                account_id uuid NOT NULL,
                posted_at timestamp with time zone NOT NULL,
                caption_text text,
                tagged_account_ids uuid[],
                created_at timestamp with time zone DEFAULT now() NOT NULL
            );

            CREATE TABLE IF NOT EXISTS warehouse.images (
                id uuid DEFAULT gen_random_uuid() NOT NULL,
                post_id uuid NOT NULL,
                image_hash text NOT NULL,
                image_url text NOT NULL,
                with_items boolean DEFAULT false NOT NULL,
                status text DEFAULT 'pending'::text NOT NULL,
                created_at timestamp with time zone DEFAULT now() NOT NULL
            );

            CREATE TABLE IF NOT EXISTS warehouse.seed_posts (
                id uuid DEFAULT gen_random_uuid() NOT NULL,
                source_post_id uuid,
                source_image_id uuid,
                image_url text NOT NULL,
                media_source jsonb,
                group_account_id uuid,
                artist_account_id uuid,
                context text,
                metadata jsonb,
                status text DEFAULT 'draft'::text NOT NULL,
                backend_post_id uuid,
                publish_error text,
                created_at timestamp with time zone DEFAULT now() NOT NULL,
                updated_at timestamp with time zone DEFAULT now() NOT NULL
            );

            CREATE TABLE IF NOT EXISTS warehouse.seed_spots (
                id uuid DEFAULT gen_random_uuid() NOT NULL,
                seed_post_id uuid NOT NULL,
                request_order integer NOT NULL,
                position_left text NOT NULL,
                position_top text NOT NULL,
                subcategory_code text,
                status text DEFAULT 'draft'::text NOT NULL,
                backend_spot_id uuid,
                publish_error text,
                created_at timestamp with time zone DEFAULT now() NOT NULL,
                updated_at timestamp with time zone DEFAULT now() NOT NULL
            );

            CREATE TABLE IF NOT EXISTS warehouse.seed_solutions (
                id uuid DEFAULT gen_random_uuid() NOT NULL,
                seed_spot_id uuid,
                original_url text,
                product_name text,
                brand text,
                price_amount numeric,
                price_currency text,
                description text,
                metadata jsonb,
                status text DEFAULT 'draft'::text NOT NULL,
                backend_solution_id uuid,
                publish_error text,
                created_at timestamp with time zone DEFAULT now() NOT NULL,
                updated_at timestamp with time zone DEFAULT now() NOT NULL
            );

            CREATE TABLE IF NOT EXISTS warehouse.seed_asset (
                id uuid DEFAULT gen_random_uuid() NOT NULL,
                seed_post_id uuid NOT NULL,
                source_url text,
                source_domain text,
                archived_url text,
                image_hash text NOT NULL,
                metadata jsonb,
                created_at timestamp with time zone DEFAULT now() NOT NULL,
                updated_at timestamp with time zone DEFAULT now() NOT NULL
            );

            CREATE TABLE IF NOT EXISTS warehouse.admin_audit_log (
                id uuid DEFAULT gen_random_uuid() NOT NULL,
                admin_user_id uuid NOT NULL,
                action text NOT NULL,
                target_table text NOT NULL,
                target_id uuid,
                before_state jsonb,
                after_state jsonb,
                metadata jsonb,
                created_at timestamp with time zone DEFAULT now() NOT NULL
            );
            "#,
        )
        .await?;

        // 4) Constraints — PKs, uniques, check constraints, FKs. All use DROP IF EXISTS + ADD.
        conn.execute_unprepared(
            r#"
            -- PKs
            ALTER TABLE warehouse.instagram_accounts DROP CONSTRAINT IF EXISTS instagram_accounts_pkey;
            ALTER TABLE warehouse.instagram_accounts ADD CONSTRAINT instagram_accounts_pkey PRIMARY KEY (id);

            ALTER TABLE warehouse.artists DROP CONSTRAINT IF EXISTS artists_pkey;
            ALTER TABLE warehouse.artists ADD CONSTRAINT artists_pkey PRIMARY KEY (id);

            ALTER TABLE warehouse.groups DROP CONSTRAINT IF EXISTS groups_pkey;
            ALTER TABLE warehouse.groups ADD CONSTRAINT groups_pkey PRIMARY KEY (id);

            ALTER TABLE warehouse.brands DROP CONSTRAINT IF EXISTS brands_pkey;
            ALTER TABLE warehouse.brands ADD CONSTRAINT brands_pkey PRIMARY KEY (id);

            ALTER TABLE warehouse.group_members DROP CONSTRAINT IF EXISTS group_members_pkey1;
            ALTER TABLE warehouse.group_members ADD CONSTRAINT group_members_pkey1 PRIMARY KEY (group_id, artist_id);

            ALTER TABLE warehouse.posts DROP CONSTRAINT IF EXISTS posts_pkey;
            ALTER TABLE warehouse.posts ADD CONSTRAINT posts_pkey PRIMARY KEY (id);

            ALTER TABLE warehouse.images DROP CONSTRAINT IF EXISTS images_pkey;
            ALTER TABLE warehouse.images ADD CONSTRAINT images_pkey PRIMARY KEY (id);

            ALTER TABLE warehouse.seed_posts DROP CONSTRAINT IF EXISTS seed_posts_pkey;
            ALTER TABLE warehouse.seed_posts ADD CONSTRAINT seed_posts_pkey PRIMARY KEY (id);

            ALTER TABLE warehouse.seed_spots DROP CONSTRAINT IF EXISTS seed_spots_pkey;
            ALTER TABLE warehouse.seed_spots ADD CONSTRAINT seed_spots_pkey PRIMARY KEY (id);

            ALTER TABLE warehouse.seed_solutions DROP CONSTRAINT IF EXISTS seed_solutions_pkey;
            ALTER TABLE warehouse.seed_solutions ADD CONSTRAINT seed_solutions_pkey PRIMARY KEY (id);

            ALTER TABLE warehouse.seed_asset DROP CONSTRAINT IF EXISTS seed_asset_pkey;
            ALTER TABLE warehouse.seed_asset ADD CONSTRAINT seed_asset_pkey PRIMARY KEY (id);

            ALTER TABLE warehouse.admin_audit_log DROP CONSTRAINT IF EXISTS admin_audit_log_pkey;
            ALTER TABLE warehouse.admin_audit_log ADD CONSTRAINT admin_audit_log_pkey PRIMARY KEY (id);

            -- Unique constraints
            ALTER TABLE warehouse.instagram_accounts
                DROP CONSTRAINT IF EXISTS warehouse_instagram_accounts_username_key;
            ALTER TABLE warehouse.instagram_accounts
                ADD CONSTRAINT warehouse_instagram_accounts_username_key UNIQUE (username);

            ALTER TABLE warehouse.posts
                DROP CONSTRAINT IF EXISTS warehouse_posts_account_id_posted_at_key;
            ALTER TABLE warehouse.posts
                ADD CONSTRAINT warehouse_posts_account_id_posted_at_key UNIQUE (account_id, posted_at);

            ALTER TABLE warehouse.images
                DROP CONSTRAINT IF EXISTS warehouse_images_post_id_image_hash_key;
            ALTER TABLE warehouse.images
                ADD CONSTRAINT warehouse_images_post_id_image_hash_key UNIQUE (post_id, image_hash);

            ALTER TABLE warehouse.seed_asset
                DROP CONSTRAINT IF EXISTS warehouse_seed_asset_image_hash_key;
            ALTER TABLE warehouse.seed_asset
                ADD CONSTRAINT warehouse_seed_asset_image_hash_key UNIQUE (image_hash);

            ALTER TABLE warehouse.seed_posts
                DROP CONSTRAINT IF EXISTS warehouse_seed_posts_backend_post_id_key;
            ALTER TABLE warehouse.seed_posts
                ADD CONSTRAINT warehouse_seed_posts_backend_post_id_key UNIQUE (backend_post_id);

            ALTER TABLE warehouse.seed_solutions
                DROP CONSTRAINT IF EXISTS warehouse_seed_solutions_backend_solution_id_key;
            ALTER TABLE warehouse.seed_solutions
                ADD CONSTRAINT warehouse_seed_solutions_backend_solution_id_key UNIQUE (backend_solution_id);

            ALTER TABLE warehouse.seed_spots
                DROP CONSTRAINT IF EXISTS warehouse_seed_spots_backend_spot_id_key;
            ALTER TABLE warehouse.seed_spots
                ADD CONSTRAINT warehouse_seed_spots_backend_spot_id_key UNIQUE (backend_spot_id);

            -- Check constraints on instagram_accounts
            ALTER TABLE warehouse.instagram_accounts
                DROP CONSTRAINT IF EXISTS warehouse_instagram_accounts_brand_xor_artist;
            ALTER TABLE warehouse.instagram_accounts
                ADD CONSTRAINT warehouse_instagram_accounts_brand_xor_artist
                CHECK (NOT (brand_id IS NOT NULL AND artist_id IS NOT NULL));

            ALTER TABLE warehouse.instagram_accounts
                DROP CONSTRAINT IF EXISTS warehouse_instagram_accounts_entity_role_when_linked;
            ALTER TABLE warehouse.instagram_accounts
                ADD CONSTRAINT warehouse_instagram_accounts_entity_role_when_linked
                CHECK (((brand_id IS NULL) AND (artist_id IS NULL)) OR (entity_ig_role IS NOT NULL));

            ALTER TABLE warehouse.instagram_accounts
                DROP CONSTRAINT IF EXISTS warehouse_instagram_accounts_wikidata_status_check;
            ALTER TABLE warehouse.instagram_accounts
                ADD CONSTRAINT warehouse_instagram_accounts_wikidata_status_check
                CHECK ((wikidata_status IS NULL) OR (wikidata_status = ANY
                    (ARRAY['matched'::text, 'not_found'::text, 'ambiguous'::text, 'error'::text])));
            "#,
        )
        .await?;

        // 5) Foreign keys (all within warehouse schema — applied after all tables exist)
        conn.execute_unprepared(
            r#"
            ALTER TABLE warehouse.artists
                DROP CONSTRAINT IF EXISTS artists_primary_instagram_account_id_fkey;
            ALTER TABLE warehouse.artists
                ADD CONSTRAINT artists_primary_instagram_account_id_fkey
                FOREIGN KEY (primary_instagram_account_id)
                REFERENCES warehouse.instagram_accounts(id) ON DELETE SET NULL;

            ALTER TABLE warehouse.groups
                DROP CONSTRAINT IF EXISTS groups_primary_instagram_account_id_fkey;
            ALTER TABLE warehouse.groups
                ADD CONSTRAINT groups_primary_instagram_account_id_fkey
                FOREIGN KEY (primary_instagram_account_id)
                REFERENCES warehouse.instagram_accounts(id) ON DELETE SET NULL;

            ALTER TABLE warehouse.brands
                DROP CONSTRAINT IF EXISTS brands_primary_instagram_account_id_fkey;
            ALTER TABLE warehouse.brands
                ADD CONSTRAINT brands_primary_instagram_account_id_fkey
                FOREIGN KEY (primary_instagram_account_id)
                REFERENCES warehouse.instagram_accounts(id) ON DELETE SET NULL;

            ALTER TABLE warehouse.group_members
                DROP CONSTRAINT IF EXISTS group_members_artist_id_fkey;
            ALTER TABLE warehouse.group_members
                ADD CONSTRAINT group_members_artist_id_fkey
                FOREIGN KEY (artist_id) REFERENCES warehouse.artists(id) ON DELETE CASCADE;

            ALTER TABLE warehouse.group_members
                DROP CONSTRAINT IF EXISTS group_members_group_id_fkey;
            ALTER TABLE warehouse.group_members
                ADD CONSTRAINT group_members_group_id_fkey
                FOREIGN KEY (group_id) REFERENCES warehouse.groups(id) ON DELETE CASCADE;

            ALTER TABLE warehouse.instagram_accounts
                DROP CONSTRAINT IF EXISTS instagram_accounts_artist_id_fkey;
            ALTER TABLE warehouse.instagram_accounts
                ADD CONSTRAINT instagram_accounts_artist_id_fkey
                FOREIGN KEY (artist_id) REFERENCES warehouse.artists(id) ON DELETE SET NULL;

            ALTER TABLE warehouse.instagram_accounts
                DROP CONSTRAINT IF EXISTS instagram_accounts_brand_id_fkey;
            ALTER TABLE warehouse.instagram_accounts
                ADD CONSTRAINT instagram_accounts_brand_id_fkey
                FOREIGN KEY (brand_id) REFERENCES warehouse.brands(id) ON DELETE SET NULL;

            ALTER TABLE warehouse.posts
                DROP CONSTRAINT IF EXISTS warehouse_posts_account_id_fkey;
            ALTER TABLE warehouse.posts
                ADD CONSTRAINT warehouse_posts_account_id_fkey
                FOREIGN KEY (account_id) REFERENCES warehouse.instagram_accounts(id) ON DELETE RESTRICT;

            ALTER TABLE warehouse.images
                DROP CONSTRAINT IF EXISTS warehouse_images_post_id_fkey;
            ALTER TABLE warehouse.images
                ADD CONSTRAINT warehouse_images_post_id_fkey
                FOREIGN KEY (post_id) REFERENCES warehouse.posts(id) ON DELETE CASCADE;

            ALTER TABLE warehouse.seed_posts
                DROP CONSTRAINT IF EXISTS warehouse_seed_posts_artist_account_id_fkey;
            ALTER TABLE warehouse.seed_posts
                ADD CONSTRAINT warehouse_seed_posts_artist_account_id_fkey
                FOREIGN KEY (artist_account_id) REFERENCES warehouse.instagram_accounts(id) ON DELETE SET NULL;

            ALTER TABLE warehouse.seed_posts
                DROP CONSTRAINT IF EXISTS warehouse_seed_posts_group_account_id_fkey;
            ALTER TABLE warehouse.seed_posts
                ADD CONSTRAINT warehouse_seed_posts_group_account_id_fkey
                FOREIGN KEY (group_account_id) REFERENCES warehouse.instagram_accounts(id) ON DELETE SET NULL;

            ALTER TABLE warehouse.seed_posts
                DROP CONSTRAINT IF EXISTS warehouse_seed_posts_source_image_id_fkey;
            ALTER TABLE warehouse.seed_posts
                ADD CONSTRAINT warehouse_seed_posts_source_image_id_fkey
                FOREIGN KEY (source_image_id) REFERENCES warehouse.images(id) ON DELETE SET NULL;

            ALTER TABLE warehouse.seed_posts
                DROP CONSTRAINT IF EXISTS warehouse_seed_posts_source_post_id_fkey;
            ALTER TABLE warehouse.seed_posts
                ADD CONSTRAINT warehouse_seed_posts_source_post_id_fkey
                FOREIGN KEY (source_post_id) REFERENCES warehouse.posts(id) ON DELETE SET NULL;

            ALTER TABLE warehouse.seed_spots
                DROP CONSTRAINT IF EXISTS warehouse_seed_spots_seed_post_id_fkey;
            ALTER TABLE warehouse.seed_spots
                ADD CONSTRAINT warehouse_seed_spots_seed_post_id_fkey
                FOREIGN KEY (seed_post_id) REFERENCES warehouse.seed_posts(id) ON DELETE CASCADE;

            ALTER TABLE warehouse.seed_solutions
                DROP CONSTRAINT IF EXISTS warehouse_seed_solutions_seed_spot_id_fkey;
            ALTER TABLE warehouse.seed_solutions
                ADD CONSTRAINT warehouse_seed_solutions_seed_spot_id_fkey
                FOREIGN KEY (seed_spot_id) REFERENCES warehouse.seed_spots(id) ON DELETE SET NULL;

            ALTER TABLE warehouse.seed_asset
                DROP CONSTRAINT IF EXISTS warehouse_seed_asset_seed_post_id_fkey;
            ALTER TABLE warehouse.seed_asset
                ADD CONSTRAINT warehouse_seed_asset_seed_post_id_fkey
                FOREIGN KEY (seed_post_id) REFERENCES warehouse.seed_posts(id) ON DELETE CASCADE;
            "#,
        )
        .await?;

        // 6) Indexes
        conn.execute_unprepared(
            r#"
            CREATE INDEX IF NOT EXISTS idx_audit_log_admin
                ON warehouse.admin_audit_log USING btree (admin_user_id);
            CREATE INDEX IF NOT EXISTS idx_audit_log_created
                ON warehouse.admin_audit_log USING btree (created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_audit_log_target
                ON warehouse.admin_audit_log USING btree (target_table, target_id);

            CREATE INDEX IF NOT EXISTS idx_warehouse_group_members_artist_id
                ON warehouse.group_members USING btree (artist_id);
            CREATE INDEX IF NOT EXISTS idx_warehouse_group_members_is_active
                ON warehouse.group_members USING btree (is_active);

            CREATE INDEX IF NOT EXISTS idx_warehouse_images_post_id
                ON warehouse.images USING btree (post_id);
            CREATE INDEX IF NOT EXISTS idx_warehouse_images_with_items
                ON warehouse.images USING btree (with_items);

            CREATE INDEX IF NOT EXISTS idx_warehouse_instagram_accounts_active
                ON warehouse.instagram_accounts USING btree (is_active);
            CREATE INDEX IF NOT EXISTS idx_warehouse_instagram_accounts_artist_id
                ON warehouse.instagram_accounts USING btree (artist_id) WHERE (artist_id IS NOT NULL);
            CREATE INDEX IF NOT EXISTS idx_warehouse_instagram_accounts_brand_id
                ON warehouse.instagram_accounts USING btree (brand_id) WHERE (brand_id IS NOT NULL);
            CREATE INDEX IF NOT EXISTS idx_warehouse_instagram_accounts_type
                ON warehouse.instagram_accounts USING btree (account_type);

            CREATE INDEX IF NOT EXISTS idx_warehouse_posts_account_id
                ON warehouse.posts USING btree (account_id);
            CREATE INDEX IF NOT EXISTS idx_warehouse_posts_posted_at
                ON warehouse.posts USING btree (posted_at);
            CREATE INDEX IF NOT EXISTS idx_warehouse_posts_tagged_account_ids
                ON warehouse.posts USING gin (tagged_account_ids);

            CREATE INDEX IF NOT EXISTS idx_warehouse_seed_asset_seed_post_id
                ON warehouse.seed_asset USING btree (seed_post_id);
            CREATE INDEX IF NOT EXISTS idx_warehouse_seed_posts_source_image_id
                ON warehouse.seed_posts USING btree (source_image_id);
            CREATE INDEX IF NOT EXISTS idx_warehouse_seed_posts_source_post_id
                ON warehouse.seed_posts USING btree (source_post_id);
            CREATE INDEX IF NOT EXISTS idx_warehouse_seed_posts_status
                ON warehouse.seed_posts USING btree (status);
            CREATE INDEX IF NOT EXISTS idx_warehouse_seed_solutions_original_url
                ON warehouse.seed_solutions USING btree (original_url);
            CREATE INDEX IF NOT EXISTS idx_warehouse_seed_solutions_seed_spot_id
                ON warehouse.seed_solutions USING btree (seed_spot_id);
            CREATE INDEX IF NOT EXISTS idx_warehouse_seed_solutions_status
                ON warehouse.seed_solutions USING btree (status);
            CREATE INDEX IF NOT EXISTS idx_warehouse_seed_spots_request_order
                ON warehouse.seed_spots USING btree (request_order);
            CREATE INDEX IF NOT EXISTS idx_warehouse_seed_spots_seed_post_id
                ON warehouse.seed_spots USING btree (seed_post_id);

            CREATE UNIQUE INDEX IF NOT EXISTS warehouse_artists_primary_ig_unique
                ON warehouse.artists USING btree (primary_instagram_account_id)
                WHERE (primary_instagram_account_id IS NOT NULL);
            CREATE UNIQUE INDEX IF NOT EXISTS warehouse_brands_primary_ig_unique
                ON warehouse.brands USING btree (primary_instagram_account_id)
                WHERE (primary_instagram_account_id IS NOT NULL);
            CREATE UNIQUE INDEX IF NOT EXISTS warehouse_groups_primary_ig_unique
                ON warehouse.groups USING btree (primary_instagram_account_id)
                WHERE (primary_instagram_account_id IS NOT NULL);

            CREATE UNIQUE INDEX IF NOT EXISTS warehouse_ig_one_primary_per_artist
                ON warehouse.instagram_accounts USING btree (artist_id)
                WHERE ((artist_id IS NOT NULL) AND (entity_ig_role = 'primary'::warehouse.entity_ig_role));
            CREATE UNIQUE INDEX IF NOT EXISTS warehouse_ig_one_primary_per_brand
                ON warehouse.instagram_accounts USING btree (brand_id)
                WHERE ((brand_id IS NOT NULL) AND (entity_ig_role = 'primary'::warehouse.entity_ig_role));
            "#,
        )
        .await?;

        // 7) Triggers — CREATE OR REPLACE TRIGGER (requires PG 14+; Supabase is 15+, local 17)
        conn.execute_unprepared(
            r#"
            CREATE OR REPLACE TRIGGER trg_artists_touch_updated_at
                BEFORE UPDATE ON warehouse.artists
                FOR EACH ROW EXECUTE FUNCTION warehouse.touch_updated_at();
            CREATE OR REPLACE TRIGGER trg_brands_touch_updated_at
                BEFORE UPDATE ON warehouse.brands
                FOR EACH ROW EXECUTE FUNCTION warehouse.touch_updated_at();
            CREATE OR REPLACE TRIGGER trg_groups_touch_updated_at
                BEFORE UPDATE ON warehouse.groups
                FOR EACH ROW EXECUTE FUNCTION warehouse.touch_updated_at();
            CREATE OR REPLACE TRIGGER trg_group_members_touch_updated_at
                BEFORE UPDATE ON warehouse.group_members
                FOR EACH ROW EXECUTE FUNCTION warehouse.touch_updated_at();
            CREATE OR REPLACE TRIGGER trg_instagram_accounts_touch_updated_at
                BEFORE UPDATE ON warehouse.instagram_accounts
                FOR EACH ROW EXECUTE FUNCTION warehouse.touch_updated_at();
            CREATE OR REPLACE TRIGGER trg_seed_asset_touch_updated_at
                BEFORE UPDATE ON warehouse.seed_asset
                FOR EACH ROW EXECUTE FUNCTION warehouse.touch_updated_at();
            CREATE OR REPLACE TRIGGER trg_seed_posts_touch_updated_at
                BEFORE UPDATE ON warehouse.seed_posts
                FOR EACH ROW EXECUTE FUNCTION warehouse.touch_updated_at();
            CREATE OR REPLACE TRIGGER trg_seed_solutions_touch_updated_at
                BEFORE UPDATE ON warehouse.seed_solutions
                FOR EACH ROW EXECUTE FUNCTION warehouse.touch_updated_at();
            CREATE OR REPLACE TRIGGER trg_seed_spots_touch_updated_at
                BEFORE UPDATE ON warehouse.seed_spots
                FOR EACH ROW EXECUTE FUNCTION warehouse.touch_updated_at();
            "#,
        )
        .await?;

        // 8) RLS — ENABLE + public-read SELECT policies (DROP IF EXISTS + CREATE)
        conn.execute_unprepared(
            r#"
            ALTER TABLE warehouse.artists ENABLE ROW LEVEL SECURITY;
            ALTER TABLE warehouse.brands ENABLE ROW LEVEL SECURITY;
            ALTER TABLE warehouse.group_members ENABLE ROW LEVEL SECURITY;
            ALTER TABLE warehouse.groups ENABLE ROW LEVEL SECURITY;
            ALTER TABLE warehouse.images ENABLE ROW LEVEL SECURITY;
            ALTER TABLE warehouse.instagram_accounts ENABLE ROW LEVEL SECURITY;
            ALTER TABLE warehouse.posts ENABLE ROW LEVEL SECURITY;
            ALTER TABLE warehouse.seed_asset ENABLE ROW LEVEL SECURITY;
            ALTER TABLE warehouse.seed_posts ENABLE ROW LEVEL SECURITY;
            ALTER TABLE warehouse.seed_solutions ENABLE ROW LEVEL SECURITY;
            ALTER TABLE warehouse.seed_spots ENABLE ROW LEVEL SECURITY;

            DROP POLICY IF EXISTS "Allow public read" ON warehouse.artists;
            CREATE POLICY "Allow public read" ON warehouse.artists FOR SELECT USING (true);
            DROP POLICY IF EXISTS "Allow public read" ON warehouse.brands;
            CREATE POLICY "Allow public read" ON warehouse.brands FOR SELECT USING (true);
            DROP POLICY IF EXISTS "Allow public read" ON warehouse.group_members;
            CREATE POLICY "Allow public read" ON warehouse.group_members FOR SELECT USING (true);
            DROP POLICY IF EXISTS "Allow public read" ON warehouse.groups;
            CREATE POLICY "Allow public read" ON warehouse.groups FOR SELECT USING (true);
            DROP POLICY IF EXISTS "Allow public read" ON warehouse.images;
            CREATE POLICY "Allow public read" ON warehouse.images FOR SELECT USING (true);
            DROP POLICY IF EXISTS "Allow public read" ON warehouse.instagram_accounts;
            CREATE POLICY "Allow public read" ON warehouse.instagram_accounts FOR SELECT USING (true);
            DROP POLICY IF EXISTS "Allow public read" ON warehouse.posts;
            CREATE POLICY "Allow public read" ON warehouse.posts FOR SELECT USING (true);
            DROP POLICY IF EXISTS "Allow public read" ON warehouse.seed_asset;
            CREATE POLICY "Allow public read" ON warehouse.seed_asset FOR SELECT USING (true);
            DROP POLICY IF EXISTS "Allow public read" ON warehouse.seed_posts;
            CREATE POLICY "Allow public read" ON warehouse.seed_posts FOR SELECT USING (true);
            DROP POLICY IF EXISTS "Allow public read" ON warehouse.seed_solutions;
            CREATE POLICY "Allow public read" ON warehouse.seed_solutions FOR SELECT USING (true);
            DROP POLICY IF EXISTS "Allow public read" ON warehouse.seed_spots;
            CREATE POLICY "Allow public read" ON warehouse.seed_spots FOR SELECT USING (true);
            "#,
        )
        .await?;

        // 9) Grants — skip on local (roles anon/authenticated don't exist). On prod, already set.
        //    These are conditional on the roles existing.
        conn.execute_unprepared(
            r#"
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
                    GRANT USAGE ON SCHEMA warehouse TO anon, authenticated, service_role;
                    GRANT SELECT ON ALL TABLES IN SCHEMA warehouse TO anon, authenticated;
                    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA warehouse TO service_role;
                END IF;
            END $$;
            "#,
        )
        .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Dropping the warehouse schema is destructive and not meaningful on prod.
        // Leaving down() as no-op matches the pattern set by m20260501_000002_auth_uid_stub.
        let _ = manager;
        Ok(())
    }
}
