-- #258 플랫폼 독립 Raw Posts 수집 파이프라인
-- warehouse.raw_post_sources: 어떤 플랫폼의 어떤 피드/계정/검색어를 수집할지 레지스트리
-- warehouse.raw_posts: 수집된 원본 포스트 (R2 업로드 완료 + parse 대기)

-- 1) 수집 소스 레지스트리
CREATE TABLE IF NOT EXISTS "warehouse"."raw_post_sources" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "platform" text NOT NULL,               -- 'pinterest' | 'instagram' | ...
    "source_type" text NOT NULL,            -- adapter 별 자유 문자열 (e.g. 'search','pin_seed','user','hashtag','board')
    "source_identifier" text NOT NULL,      -- adapter 가 해석 (검색어 / 계정명 / 핀 ID / 해시태그 등)
    "label" text,
    "is_active" boolean DEFAULT true NOT NULL,
    "fetch_interval_seconds" integer DEFAULT 3600 NOT NULL,
    "last_enqueued_at" timestamp with time zone,    -- dispatcher 가 ARQ enqueue 시점 갱신
    "last_scraped_at" timestamp with time zone,     -- callback 에서 SUCCESS 시 갱신
    "metadata" jsonb,                                -- 어댑터 설정 확장 (BFS depth 등)
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "warehouse"."raw_post_sources" OWNER TO "postgres";

ALTER TABLE ONLY "warehouse"."raw_post_sources"
    ADD CONSTRAINT "raw_post_sources_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "warehouse"."raw_post_sources"
    ADD CONSTRAINT "raw_post_sources_unique_target"
    UNIQUE ("platform", "source_type", "source_identifier");

CREATE INDEX "raw_post_sources_active_platform_idx"
    ON "warehouse"."raw_post_sources" USING btree ("is_active", "platform");

CREATE INDEX "raw_post_sources_due_idx"
    ON "warehouse"."raw_post_sources" USING btree ("last_enqueued_at")
    WHERE "is_active" = true;

-- 2) 수집된 원본 포스트
CREATE TABLE IF NOT EXISTS "warehouse"."raw_posts" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "source_id" uuid NOT NULL,
    "platform" text NOT NULL,
    "external_id" text NOT NULL,            -- 플랫폼 상의 고유 ID (pin_id, shortcode, etc.)
    "external_url" text NOT NULL,           -- 플랫폼 상의 permalink
    "image_url" text NOT NULL,              -- 플랫폼 원본 CDN URL (보존용)
    "r2_key" text,                          -- R2 버킷 내 key ('{platform}/{Y/M}/{external_id}.{ext}')
    "r2_url" text,                          -- public URL
    "image_hash" text,                      -- perceptual hash (#261 에서 사용)
    "caption" text,
    "author_name" text,
    "parse_status" text DEFAULT 'pending' NOT NULL,
    "parse_result" jsonb,                   -- #260 Vision AI 출력
    "parse_error" text,
    "parse_attempts" integer DEFAULT 0 NOT NULL,
    "seed_post_id" uuid,                    -- #260 에서 생성한 seed_posts.id
    "platform_metadata" jsonb,              -- 플랫폼별 확장 (like_count, board_id, etc.)
    "dispatch_id" text,                     -- 마지막 dispatch batch ID (디버깅/추적용)
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "warehouse"."raw_posts" OWNER TO "postgres";

ALTER TABLE ONLY "warehouse"."raw_posts"
    ADD CONSTRAINT "raw_posts_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "warehouse"."raw_posts"
    ADD CONSTRAINT "raw_posts_unique_external"
    UNIQUE ("platform", "external_id");

ALTER TABLE ONLY "warehouse"."raw_posts"
    ADD CONSTRAINT "raw_posts_parse_status_check"
    CHECK ("parse_status" IN ('pending', 'parsing', 'parsed', 'failed', 'skipped'));

ALTER TABLE ONLY "warehouse"."raw_posts"
    ADD CONSTRAINT "raw_posts_source_id_fkey"
    FOREIGN KEY ("source_id")
    REFERENCES "warehouse"."raw_post_sources"("id")
    ON DELETE CASCADE;

ALTER TABLE ONLY "warehouse"."raw_posts"
    ADD CONSTRAINT "raw_posts_seed_post_id_fkey"
    FOREIGN KEY ("seed_post_id")
    REFERENCES "warehouse"."seed_posts"("id")
    ON DELETE SET NULL;

CREATE INDEX "raw_posts_source_idx"
    ON "warehouse"."raw_posts" USING btree ("source_id");

CREATE INDEX "raw_posts_parse_status_idx"
    ON "warehouse"."raw_posts" USING btree ("parse_status", "created_at");

CREATE INDEX "raw_posts_platform_idx"
    ON "warehouse"."raw_posts" USING btree ("platform");

-- 3) updated_at auto-bump 트리거 (기존 warehouse 패턴 동일)
CREATE OR REPLACE FUNCTION "warehouse"."set_updated_at"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "raw_post_sources_set_updated_at" ON "warehouse"."raw_post_sources";
CREATE TRIGGER "raw_post_sources_set_updated_at"
  BEFORE UPDATE ON "warehouse"."raw_post_sources"
  FOR EACH ROW EXECUTE FUNCTION "warehouse"."set_updated_at"();

DROP TRIGGER IF EXISTS "raw_posts_set_updated_at" ON "warehouse"."raw_posts";
CREATE TRIGGER "raw_posts_set_updated_at"
  BEFORE UPDATE ON "warehouse"."raw_posts"
  FOR EACH ROW EXECUTE FUNCTION "warehouse"."set_updated_at"();

-- 4) RLS: 공개 read, 쓰기는 service_role (api-server) 만
ALTER TABLE "warehouse"."raw_post_sources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "warehouse"."raw_posts" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "raw_post_sources_select_public" ON "warehouse"."raw_post_sources";
CREATE POLICY "raw_post_sources_select_public"
  ON "warehouse"."raw_post_sources"
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "raw_posts_select_public" ON "warehouse"."raw_posts";
CREATE POLICY "raw_posts_select_public"
  ON "warehouse"."raw_posts"
  FOR SELECT
  USING (true);
