-- #260 + #261 — Original image reverse search pipeline
--
-- Adds `raw_posts.original_status` lifecycle column and a new
-- `warehouse.source_media_originals` table tracking R2-archived originals
-- surfaced via reverse image search (GCP Cloud Vision Web Detection).
--
-- Idempotent — safe to re-run.

-- Lifecycle column on raw_posts (search hasn't run yet → 'pending')
ALTER TABLE "warehouse"."raw_posts"
    ADD COLUMN IF NOT EXISTS "original_status" text
        DEFAULT 'pending' NOT NULL;

-- Only add the check constraint once. Drop any existing with the same name
-- so re-runs with different value sets don't conflict.
ALTER TABLE "warehouse"."raw_posts"
    DROP CONSTRAINT IF EXISTS "raw_posts_original_status_check";
ALTER TABLE "warehouse"."raw_posts"
    ADD CONSTRAINT "raw_posts_original_status_check"
        CHECK ("original_status" IN ('pending','searching','found','not_found','skipped'));

CREATE INDEX IF NOT EXISTS "raw_posts_original_status_idx"
    ON "warehouse"."raw_posts" USING btree ("original_status", "parse_status");

-- One-to-many: a raw_post can surface multiple original candidates. The
-- first successful archive is the 'primary'; `is_primary=true` means this
-- is the URL currently referenced by seed_posts.image_url.
CREATE TABLE IF NOT EXISTS "warehouse"."source_media_originals" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "raw_post_id" uuid NOT NULL,
    "origin_url" text NOT NULL,
    "origin_domain" text NOT NULL,
    "r2_key" text NOT NULL,
    "r2_url" text NOT NULL,
    "width" integer,
    "height" integer,
    "byte_size" integer,
    "image_hash" text,
    "search_provider" text NOT NULL,
    "is_primary" boolean DEFAULT false NOT NULL,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "source_media_originals_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "source_media_originals_raw_post_id_fkey"
        FOREIGN KEY ("raw_post_id")
        REFERENCES "warehouse"."raw_posts"("id") ON DELETE CASCADE,
    CONSTRAINT "source_media_originals_r2_key_unique" UNIQUE ("r2_key")
);

CREATE INDEX IF NOT EXISTS "source_media_originals_raw_post_idx"
    ON "warehouse"."source_media_originals" USING btree ("raw_post_id");

-- At most one primary per raw_post.
CREATE UNIQUE INDEX IF NOT EXISTS "source_media_originals_one_primary_per_raw_post"
    ON "warehouse"."source_media_originals" ("raw_post_id")
    WHERE "is_primary" = true;

ALTER TABLE "warehouse"."source_media_originals" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "source_media_originals_select_public"
    ON "warehouse"."source_media_originals";
CREATE POLICY "source_media_originals_select_public"
    ON "warehouse"."source_media_originals" FOR SELECT USING (true);
